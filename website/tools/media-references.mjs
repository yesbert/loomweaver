/* Every picture and poster a built page asks the site for out of its own media folder. The copy
   into that folder is a list someone keeps, so the build checks the pages against what arrived. */

const REFERENCE = /(?:src|poster)="(\/media\/[^"#?]+)/g;

export function mediaReferences(html) {
  return [...new Set([...html.matchAll(REFERENCE)].map((match) => match[1]))];
}
