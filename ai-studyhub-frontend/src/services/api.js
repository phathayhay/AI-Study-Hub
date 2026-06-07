export function apiGet(url) {
  return fetch(url).then((res) => res.json())
}
