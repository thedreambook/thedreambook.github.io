// Global configuration constants for the website

export const SITE_TITLE = "The Dream Book";
export const SITE_DESCRIPTION = "systems, software engineering, and architecture notes.";
export const AUTHOR_NAME = "wuttinanhi";
export const AUTHOR_AVATAR = "https://github.com/wuttinanhi.png";
export const AUTHOR_BIO = "Software Engineer. Passionate about systems architecture, Rust, Go, Linux, and backend infrastructure.";

/**
 * Recognized author identifiers across blog publications.
 */
export enum AuthorId {
  Dreamoutbox = "dreamoutbox",
  Wuttinanhi = "wuttinanhi",
}

/**
 * Author profile metadata used in blog posts and author cards.
 */
export interface AuthorProfile {
  name: string;
  avatar: string;
  bio: string;
  github: string;
}

export const AUTHORS: Record<AuthorId, AuthorProfile> = {
  [AuthorId.Dreamoutbox]: {
    name: "dreamoutbox",
    avatar: "https://github.com/dreamoutbox.png",
    bio: AUTHOR_BIO,
    github: "https://github.com/dreamoutbox",
  },
  [AuthorId.Wuttinanhi]: {
    name: "wuttinanhi",
    avatar: "https://github.com/wuttinanhi.png",
    bio: AUTHOR_BIO,
    github: "https://github.com/wuttinanhi",
  },
};

export const DEFAULT_AUTHOR_ID = AuthorId.Dreamoutbox;

/**
 * Resolves the author profile for a given author identifier.
 * If author is omitted or unlisted, defaults to the default author (dreamoutbox).
 *
 * @param author - Optional author identifier string or AuthorId enum value
 * @returns Complete AuthorProfile with display name, avatar, bio, and github URL
 *
 * @example
 * ```ts
 * const profile = getAuthorProfile(AuthorId.Wuttinanhi);
 * console.log(profile.name); // "wuttinanhi"
 *
 * const defaultProfile = getAuthorProfile();
 * console.log(defaultProfile.name); // "dreamoutbox"
 * ```
 */
export function getAuthorProfile(author?: string | AuthorId): AuthorProfile {
  if (author && author in AUTHORS) {
    return AUTHORS[author as AuthorId];
  }

  if (author) {
    return {
      name: author,
      avatar: `https://github.com/${author}.png`,
      bio: AUTHOR_BIO,
      github: `https://github.com/${author}`,
    };
  }

  return AUTHORS[DEFAULT_AUTHOR_ID];
}
