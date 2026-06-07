export function uploadFile(file) {
  return Promise.resolve({ success: true, fileName: file.name })
}
