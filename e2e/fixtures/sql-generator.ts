#!/usr/bin/env tsx
import { writeFileSync, mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import {
	users, places, goodsTypes, goods, currencies, currencyAccounts,
	cards, groups, userGroups, transactions,
} from './data';

type SqlValue = string | number | boolean | null | undefined | Date;

function sqlValue(v: SqlValue): string {
	if (v === null || v === undefined) return 'NULL';
	if (typeof v === 'number') return String(v);
	if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
	if (v instanceof Date) return `'${v.toISOString()}'::timestamptz`;
	return `'${String(v).replace(/'/g, "''")}'`;
}

function insert(table: string, rows: Record<string, SqlValue>[]): string {
	if (rows.length === 0) return '';
	const cols = Object.keys(rows[0]!);
	const values = rows.map(r => '  (' + cols.map(c => sqlValue(r[c])).join(', ') + ')').join(',\n');
	return `INSERT INTO ${table} (${cols.join(', ')}) VALUES\n${values};\n`;
}

function setSeq(table: string, max: number): string {
	return `SELECT setval('${table}_id_seq', ${max + 1}, false);\n`;
}

const out: string[] = [];

out.push('-- ============================================================');
out.push('-- Generated from e2e/fixtures/data — do not edit by hand.');
out.push('-- Run: npm run e2e:gen-sql');
out.push('--');
out.push('-- ASSUMPTIONS:');
out.push('--   * Postgres dialect');
out.push('--   * snake_case column names (member_id, currency_id, ...)');
out.push('--   * Junction tables: user_roles(user_id, role),');
out.push('--                       user_groups(user_id, group_id)');
out.push('--   * password_hash placeholders contain plaintext for migration to bcrypt');
out.push('-- ============================================================');
out.push('BEGIN;');
out.push('');

out.push('-- USERS');
// Password placeholder format intentionally avoids the bcrypt prefix
// ($2a$, $2b$, $2y$). A previous form `$2a$10$REPLACE_WITH_BCRYPT_OF_<pw>`
// was indistinguishable from a real bcrypt hash to grep-based tooling and
// embedded the plaintext after a recognisable separator. The PLACEHOLDER:
// prefix below is loud and unmistakeable: any code that loads this seed
// MUST bcrypt the plaintext before storing.
out.push(insert('users', users.map(u => ({
	id: u.id,
	name: u.name,
	email: u.email,
	password_hash: `__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=${u.password}`,
	member_id: u.memberId,
	blocked: u.blocked,
}))));
out.push(setSeq('users', Math.max(...users.map(u => u.id))));

out.push('-- USER_ROLES');
const roleRows = users.flatMap(u => u.roles.map(role => ({ user_id: u.id, role })));
out.push(insert('user_roles', roleRows));

out.push('-- PLACES');
out.push(insert('places', places.map(p => ({
	id: p.id, name: p.name, type: p.type ?? null, api_token: p.apiToken ?? null,
}))));
out.push(setSeq('places', Math.max(...places.map(p => p.id))));

out.push('-- GOODS_TYPES');
out.push(insert('goods_types', goodsTypes.map(t => ({
	id: t.id, name: t.name, icon: t.icon, deleted: t.deleted,
}))));
out.push(setSeq('goods_types', Math.max(...goodsTypes.map(t => t.id))));

out.push('-- GOODS');
out.push(insert('goods', goods.map(g => ({
	id: g.id, goods_type_id: g.goodsTypeId, name: g.name, price: g.price,
	currency_id: g.currencyId, place_id: g.placeId, deleted: g.deleted,
}))));
out.push(setSeq('goods', Math.max(...goods.map(g => g.id))));

out.push('-- CURRENCIES');
out.push(insert('currencies', currencies.map(c => ({
	id: c.id, name: c.name, code: c.code, symbol: c.symbol,
	min_recharge_amount_warn: c.minRechargeAmountWarn,
	max_recharge_amount_warn: c.maxRechargeAmountWarn,
	blocked: c.blocked,
}))));
out.push(setSeq('currencies', Math.max(...currencies.map(c => c.id))));

out.push('-- CURRENCY_ACCOUNTS');
out.push(insert('currency_accounts', currencyAccounts.map(a => ({
	id: a.id, user_id: a.userId, currency_id: a.currencyId,
	current_amount: a.currentAmount, overdraft_limit: a.overdraftLimit,
}))));
out.push(setSeq('currency_accounts', Math.max(...currencyAccounts.map(a => a.id))));

out.push('-- CARDS');
out.push(insert('cards', cards.map(c => ({
	id: c.id, uid: c.uid, user_id: c.userId,
}))));
out.push(setSeq('cards', Math.max(...cards.map(c => c.id))));

out.push('-- GROUPS');
out.push(insert('groups', groups.map(g => ({
	id: g.id, name: g.name, description: g.description, color: g.color,
}))));
out.push(setSeq('groups', Math.max(...groups.map(g => g.id))));

out.push('-- USER_GROUPS');
out.push(insert('user_groups', userGroups.map(ug => ({
	user_id: ug.userId, group_id: ug.groupId,
}))));

out.push('-- TRANSACTIONS');
out.push(insert('transactions', transactions.map(t => ({
	id: t.id, user_id: t.userId, place_id: t.placeId,
	amount: t.amount, currency_id: t.currencyId,
	type: t.type,
	cancellation: t.cancellation,
	info: t.info,
	created_at: t.created,
}))));
out.push(setSeq('transactions', Math.max(...transactions.map(t => t.id))));

out.push('');
out.push('COMMIT;');

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const outPath = resolve(__dirname, '..', 'seed', 'seed.sql');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, out.join('\n'), 'utf8');
console.log(`Wrote ${outPath}`);
