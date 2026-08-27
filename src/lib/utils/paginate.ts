export function paginate<T>(page = 1, pageSize = 6, data: T[]) {
  const indexOfLastPost = page * pageSize;
  const indexOfFirstPost = indexOfLastPost - pageSize;
  return data.slice(indexOfFirstPost, indexOfLastPost);
}
