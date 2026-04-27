-- ============================================================
-- Generated from e2e/fixtures/data — do not edit by hand.
-- Run: npm run e2e:gen-sql
--
-- ASSUMPTIONS:
--   * Postgres dialect
--   * snake_case column names (member_id, currency_id, ...)
--   * Junction tables: user_roles(user_id, role),
--                       user_groups(user_id, group_id)
--   * password_hash placeholders contain plaintext for migration to bcrypt
-- ============================================================
BEGIN;

-- USERS
INSERT INTO users (id, name, email, password_hash, member_id, blocked) VALUES
  (1, 'Admin Adminský', 'admin@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=admin123', 1001, FALSE),
  (2, 'Pavel Pokladní', 'worker@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=worker123', 1002, FALSE),
  (3, 'Petr PowerSales', 'power@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=power123', 1003, FALSE),
  (4, 'Marie Členka', 'member@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=member123', 1004, FALSE),
  (5, 'Jana Zákaznice', 'jana@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=jana123', 1005, FALSE),
  (6, 'Karel Zablokovaný', 'karel@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=karel123', 1006, TRUE),
  (7, 'Tomáš Tučný', 'tomas@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=pwd123', 1007, FALSE),
  (8, 'Lucie Lišková', 'lucie@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=pwd123', 1008, FALSE),
  (9, 'Ondřej Otec', 'ondrej@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=pwd123', 1009, FALSE),
  (10, 'Eva Eko', 'eva@test.cz', '__E2E_PLACEHOLDER__BCRYPT_REQUIRED__plaintext=pwd123', 1010, FALSE);

SELECT setval('users_id_seq', 11, false);

-- USER_ROLES
INSERT INTO user_roles (user_id, role) VALUES
  (1, 'Admin'),
  (2, 'Worker'),
  (3, 'PowerSalesman'),
  (4, 'Member'),
  (5, 'Member'),
  (6, 'Member'),
  (7, 'Member'),
  (8, 'Member'),
  (9, 'Member'),
  (10, 'Member');

-- PLACES
INSERT INTO places (id, name, type, api_token) VALUES
  (1, 'Hlavní bar', 'Bar', 'token-bar-1'),
  (2, 'Vedlejší bar', 'Bar', 'token-bar-2'),
  (3, 'Registrace', 'Registration', 'token-reg-1');

SELECT setval('places_id_seq', 4, false);

-- GOODS_TYPES
INSERT INTO goods_types (id, name, icon, deleted) VALUES
  (1, 'Nápoje', 'local_bar', FALSE),
  (2, 'Jídlo', 'restaurant', FALSE),
  (3, 'Merch', 'shopping_bag', FALSE),
  (4, 'Služby', 'room_service', FALSE);

SELECT setval('goods_types_id_seq', 5, false);

-- GOODS
INSERT INTO goods (id, goods_type_id, name, price, currency_id, place_id, deleted) VALUES
  (1, 1, 'Pivo 0,5l', 50, 1, 1, FALSE),
  (2, 1, 'Víno 0,2l', 60, 1, 1, FALSE),
  (3, 1, 'Voda', 25, 1, 1, FALSE),
  (4, 2, 'Klobása', 80, 1, 1, FALSE),
  (5, 2, 'Hranolky', 60, 1, 1, FALSE),
  (6, 1, 'Káva', 40, 1, 1, FALSE),
  (7, 3, 'Tričko', 350, 1, 1, FALSE),
  (8, 4, 'Šatna', 30, 1, 1, FALSE),
  (9, 1, 'Pivo 0,3l', 35, 1, 2, FALSE),
  (10, 1, 'Limonáda', 30, 1, 2, FALSE),
  (11, 2, 'Bagel', 70, 1, 2, FALSE),
  (12, 3, 'Náramek', 100, 1, 2, FALSE);

SELECT setval('goods_id_seq', 13, false);

-- CURRENCIES
INSERT INTO currencies (id, name, code, symbol, min_recharge_amount_warn, max_recharge_amount_warn, blocked) VALUES
  (1, 'Koruna festivalu', 'KRF', 'Kč', 100, 5000, FALSE),
  (2, 'BlockedCoin', 'BLK', '₿', 0, 0, TRUE);

SELECT setval('currencies_id_seq', 3, false);

-- CURRENCY_ACCOUNTS
INSERT INTO currency_accounts (id, user_id, currency_id, current_amount, overdraft_limit) VALUES
  (1, 1, 1, 1000, 0),
  (2, 2, 1, 0, 0),
  (3, 3, 1, 500, 0),
  (4, 4, 1, 500, 0),
  (5, 5, 1, 50, 100),
  (6, 6, 1, 0, 0),
  (7, 7, 1, 200, 0),
  (8, 8, 1, 750, 0),
  (9, 9, 1, 0, 0),
  (10, 10, 1, 100, 0);

SELECT setval('currency_accounts_id_seq', 11, false);

-- CARDS
INSERT INTO cards (id, uid, user_id) VALUES
  (1, 1111111111, 4),
  (2, 2222222222, 5),
  (3, 3333333333, 3),
  (4, 4444444444, 7),
  (5, 5555555555, 8),
  (6, 6666666666, 9),
  (7, 7777777777, 10),
  (8, 8888888888, 1);

SELECT setval('cards_id_seq', 9, false);

-- GROUPS
INSERT INTO groups (id, name, description, color) VALUES
  (1, 'VIP', 'VIP hosté', '#ff0000'),
  (2, 'Staff', 'Personál', '#00ff00'),
  (3, 'Návštěvníci', 'Běžní návštěvníci', '#0000ff');

SELECT setval('groups_id_seq', 4, false);

-- USER_GROUPS
INSERT INTO user_groups (user_id, group_id) VALUES
  (4, 1),
  (5, 1),
  (5, 2),
  (8, 2),
  (9, 3);

-- TRANSACTIONS
INSERT INTO transactions (id, user_id, place_id, amount, currency_id, type, cancellation, info, created_at) VALUES
  (1, 4, 1, -50, 1, 'Payment', FALSE, '', '2026-04-25T12:00:00.000Z'),
  (2, 4, 1, -80, 1, 'Payment', FALSE, '', '2026-04-25T12:00:00.000Z'),
  (3, 5, 1, -30, 1, 'Payment', FALSE, '', '2026-04-24T12:00:00.000Z'),
  (4, 5, 2, -70, 1, 'Payment', FALSE, '', '2026-04-23T12:00:00.000Z'),
  (5, 7, 1, -100, 1, 'Payment', FALSE, '', '2026-04-21T12:00:00.000Z'),
  (6, 4, 1, 500, 1, 'Deposit', FALSE, '', '2026-04-19T12:00:00.000Z'),
  (7, 5, 3, 200, 1, 'Deposit', FALSE, '', '2026-04-12T12:00:00.000Z'),
  (8, 8, 2, -60, 1, 'Payment', FALSE, '', '2026-04-11T12:00:00.000Z'),
  (9, 8, 1, -50, 1, 'Payment', FALSE, '', '2026-04-06T12:00:00.000Z'),
  (10, 7, 2, -35, 1, 'Payment', FALSE, '', '2026-04-01T12:00:00.000Z'),
  (11, 4, 2, -100, 1, 'Payment', FALSE, '', '2026-03-27T12:00:00.000Z'),
  (12, 5, 1, -25, 1, 'Payment', FALSE, '', '2026-03-22T12:00:00.000Z'),
  (13, 9, 1, -80, 1, 'Payment', FALSE, '', '2026-03-17T12:00:00.000Z'),
  (14, 10, 1, 100, 1, 'Deposit', FALSE, '', '2026-03-12T12:00:00.000Z'),
  (15, 10, 1, -25, 1, 'Payment', FALSE, '', '2026-03-07T12:00:00.000Z'),
  (16, 8, 2, -90, 1, 'Payment', FALSE, '', '2026-02-25T12:00:00.000Z'),
  (17, 4, 1, -40, 1, 'Payment', FALSE, '', '2026-02-15T12:00:00.000Z'),
  (18, 7, 1, -50, 1, 'Payment', FALSE, '', '2026-02-05T12:00:00.000Z'),
  (19, 5, 1, -30, 1, 'Payment', FALSE, '', '2026-01-31T12:00:00.000Z'),
  (20, 9, 2, -70, 1, 'Payment', FALSE, '', '2026-01-28T12:00:00.000Z'),
  (21, 4, 1, -25, 1, 'Payment', FALSE, '', '2026-04-24T12:00:00.000Z'),
  (22, 5, 1, -40, 1, 'Payment', FALSE, '', '2026-04-22T12:00:00.000Z'),
  (23, 7, 1, -55, 1, 'Payment', FALSE, '', '2026-04-20T12:00:00.000Z'),
  (24, 8, 1, -65, 1, 'Payment', FALSE, '', '2026-04-18T12:00:00.000Z'),
  (25, 9, 1, -75, 1, 'Payment', FALSE, '', '2026-04-16T12:00:00.000Z'),
  (26, 10, 1, -85, 1, 'Payment', FALSE, '', '2026-04-14T12:00:00.000Z'),
  (27, 4, 2, -45, 1, 'Payment', FALSE, '', '2026-04-10T12:00:00.000Z'),
  (28, 5, 2, -55, 1, 'Payment', FALSE, '', '2026-04-08T12:00:00.000Z'),
  (29, 7, 2, -65, 1, 'Payment', FALSE, '', '2026-04-04T12:00:00.000Z'),
  (30, 8, 2, -75, 1, 'Payment', FALSE, '', '2026-03-29T12:00:00.000Z');

SELECT setval('transactions_id_seq', 31, false);


COMMIT;