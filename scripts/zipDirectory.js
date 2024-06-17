/*
 * ZIP a directory while adhering to .gitignore
 */
const path = require('path');

async function zipDir(dir, outputFile) {
  const [
    { create_zip },
    { list_entries },
    { is_windows },
  ] = await Promise.all([
    import('node-zip-cli/dist/core/zip.mjs'),
    import('node-zip-cli/dist/core/walk.mjs'),
    import('node-zip-cli/dist/core/constants.mjs'),
  ]);
  const [
    unique_list,
    conflicting_list,
    absolute_path_to_clean_entry_with_mode,
  ] = await list_entries(
    [path.normalize(dir)],
    is_windows,
    'none', // keepParent
    'none', // symlink
    false, // allowGit
    [], // exclude
    'none', // disableIgnore
  );
  if (conflicting_list.length) {
    throw new Error(
      `Can not zip reqpository because of conflicting files ${conflicting_list.join(',')}`,
    );
  }
  await create_zip(
    outputFile,
    unique_list,
    absolute_path_to_clean_entry_with_mode,
    unique_list.filter((el) => el.type !== 'directory').length,
    6, // compression level (0 - 9)
    is_windows,
  )
}

module.exports = zipDir;
