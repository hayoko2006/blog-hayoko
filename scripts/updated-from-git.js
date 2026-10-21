/* global hexo */
'use strict';

const { execSync } = require('child_process');
const { join } = require('path');

// 问题：CI 的 actions/checkout 会把所有文件 mtime 刷成构建时刻，
// 而 updated_option: 'mtime' 会让全站 updated 失真为部署当天。
// 方案：用 git 最后一次提交时间作为文章/页面的真实更新时间。
// - 未提交的新文件查不到 git 记录，回退到 Hexo 默认行为（本地 mtime 即真实编辑时间）
// - front-matter 手写了 updated: 的文件尊重手写值，不做覆盖
// - 结果按文件缓存，避免重复调用 git

const cache = new Map();
const srcDir = join(hexo.base_dir, hexo.config.source_dir);

function lastCommitDate(file) {
  const key = file.replace(/\\/g, '/');
  if (!cache.has(key)) {
    let date = '';
    try {
      date = execSync(
        `git log -1 --format=%cI -- "${key}"`,
        { cwd: hexo.base_dir, encoding: 'utf8' }
      ).trim();
    } catch (err) {
      // 不在 git 仓库中或 git 不可用时静默回退到默认行为
    }
    cache.set(key, date);
  }
  return cache.get(key);
}

hexo.extend.filter.register('before_post_render', data => {
  if (!data.source || /^updated:/m.test(data.raw || '')) return data;
  const date = lastCommitDate(join(srcDir, data.source));
  if (date) data.updated = new Date(date);
  return data;
});
