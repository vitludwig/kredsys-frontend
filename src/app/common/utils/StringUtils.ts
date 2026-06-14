export class StringUtils {

	/**
   * Removes Czech (and other) diacritics from a string by converting them
   * to their closest ASCII equivalents using Unicode normalization (NFD).
   *
   * For example: "Příliš žluťoučký kůň úpěl ďábelské ódy."
   * becomes "Prilis zlutoucky kun upel dabelske ody."
   *
   * Note: Handles characters like 'ď'/'ť' becoming 'd'/'t', 'ě' becoming 'e', 'ů' becoming 'u'.
   *
   * @param input The string possibly containing Czech diacritics.
   * @returns A new string with diacritics removed, or the original string if input is null, undefined, or empty.
   */
	public static removeAccents(input: string | null | undefined): string {
		if (!input) { // Checks for null, undefined, or empty string
			return input ?? ''; // Return empty string for null/undefined, or the original empty string
		}

		// 1. Normalize the string using NFD (Canonical Decomposition).
		// This separates base characters from their combining diacritical marks.
		// e.g., 'č' becomes 'c' + 'ˇ' (combining caron).
		const normalizedString = input.normalize('NFD');

		// 2. Remove the combining diacritical marks using a regex.
		// The \p{M} property escape matches any Unicode mark character (including combining marks).
		// The 'u' flag is necessary for Unicode property escapes.
		// The 'g' flag ensures all occurrences are replaced.
		return normalizedString.replace(/\p{M}/gu, '');
	}
}
