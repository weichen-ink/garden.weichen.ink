/**
 * 文件扩展名配置
 * 将原本硬编码的扩展名配置外部化，提高可维护性
 */

// 图片文件扩展名
const IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'];

// 文档文件扩展名
const DOCUMENT_EXTENSIONS = ['pdf', 'doc', 'docx', 'txt', 'md'];

// 压缩文件扩展名
const ARCHIVE_EXTENSIONS = ['zip', 'rar', '7z', 'tar', 'gz'];

// 音视频文件扩展名
const MEDIA_EXTENSIONS = ['mp4', 'mp3', 'wav', 'avi', 'mov', 'mkv'];

// 代码文件扩展名
const CODE_EXTENSIONS = ['html', 'css', 'js', 'py', 'java', 'cpp', 'c', 'h', 'scss', 'less'];

// 配置文件扩展名
const CONFIG_EXTENSIONS = ['yaml', 'yml', 'toml', 'ini', 'json', 'xml', 'csv'];

// 其他文件扩展名
const OTHER_EXTENSIONS = ['xlsx', 'pptx', 'log', 'bat', 'sh'];

// 合并所有支持的文件扩展名
const ALL_FILE_EXTENSIONS = [
  ...IMAGE_EXTENSIONS,
  ...DOCUMENT_EXTENSIONS,
  ...ARCHIVE_EXTENSIONS,
  ...MEDIA_EXTENSIONS,
  ...CODE_EXTENSIONS,
  ...CONFIG_EXTENSIONS,
  ...OTHER_EXTENSIONS
];

// 创建正则表达式
const createExtensionRegex = (extensions) => {
  return new RegExp(`\\.(${extensions.join('|')})$`, 'i');
};

module.exports = {
  IMAGE_EXTENSIONS,
  DOCUMENT_EXTENSIONS,
  ARCHIVE_EXTENSIONS,
  MEDIA_EXTENSIONS,
  CODE_EXTENSIONS,
  CONFIG_EXTENSIONS,
  OTHER_EXTENSIONS,
  ALL_FILE_EXTENSIONS,
  
  // 正则表达式
  imageExtensions: createExtensionRegex(IMAGE_EXTENSIONS),
  fileExtensions: createExtensionRegex(ALL_FILE_EXTENSIONS),
  
  // 辅助函数
  isImageFile: (filename) => createExtensionRegex(IMAGE_EXTENSIONS).test(filename),
  isDocumentFile: (filename) => createExtensionRegex(DOCUMENT_EXTENSIONS).test(filename),
  isSupportedFile: (filename) => createExtensionRegex(ALL_FILE_EXTENSIONS).test(filename)
};