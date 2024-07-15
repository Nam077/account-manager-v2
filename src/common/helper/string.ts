export const toLowerCase = (str: string): string => str.toLowerCase();
export const toUpperCase = (str: string): string => str.toUpperCase();
export const toCapitalize = (str: string): string =>
    str
        .toLowerCase()
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

export const extractLinksWithHost = (
    text: string,
): {
    host: string;
    url: string;
}[] => {
    if (!text) return [];

    // Regular expression to match URLs
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    // Find all matches in the text
    const matches = text.match(urlRegex);

    if (matches) {
        return matches.map((match) => {
            const url = new URL(match);

            return {
                // in hoa chữ cái đầu
                host: url.host
                    .split('.')
                    .slice(-2)
                    .join('.')
                    .replace(/^[^.]/, (char) => char.toUpperCase()),
                url: match,
            };
        });
    }

    // Return matches or an empty array if no matches found
    return matches
        ? matches.map((match) => {
              const url = new URL(match);

              return {
                  host: url.host
                      .split('.')
                      .slice(-2)
                      .join('.')
                      .replace(/^[^.]/, (char) => char.toUpperCase()),
                  url: match,
              };
          })
        : [];
};
