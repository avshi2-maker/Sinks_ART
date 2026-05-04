/**
 * cloudinary.test.ts
 *
 * Tests for the URL transform helpers in cloudinary.ts.
 * Does NOT test uploadToCloudinary (would need a real network call + a real file).
 * Run via: npx tsx src/lib/intake/cloudinary.test.ts
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 03/05/2026
 */

import {
    getVideoFrameUrl,
    getPdfPreviewUrl,
    getResizedImageUrl,
    isCloudinaryConfigured,
    CLOUDINARY_CONFIG,
  } from './cloudinary';
  
  interface Case {
    label:    string;
    input:    string;
    expected: string;
    fn:       (s: string) => string;
  }
  
  const cases: Case[] = [
    // ---- getVideoFrameUrl ----
    {
      label:    'video frame: standard mp4 URL',
      input:    'https://res.cloudinary.com/dqdku88vv/video/upload/v123/marble-sinks/intake/clip.mp4',
      expected: 'https://res.cloudinary.com/dqdku88vv/video/upload/so_1,w_1200,f_jpg/v123/marble-sinks/intake/clip.jpg',
      fn:       getVideoFrameUrl,
    },
    {
      label:    'video frame: mov extension',
      input:    'https://res.cloudinary.com/x/video/upload/clip.mov',
      expected: 'https://res.cloudinary.com/x/video/upload/so_1,w_1200,f_jpg/clip.jpg',
      fn:       getVideoFrameUrl,
    },
    {
      label:    'video frame: webm extension',
      input:    'https://res.cloudinary.com/x/video/upload/clip.webm',
      expected: 'https://res.cloudinary.com/x/video/upload/so_1,w_1200,f_jpg/clip.jpg',
      fn:       getVideoFrameUrl,
    },
    {
      label:    'video frame: 3gp (older Android)',
      input:    'https://res.cloudinary.com/x/video/upload/v1/clip.3gp',
      expected: 'https://res.cloudinary.com/x/video/upload/so_1,w_1200,f_jpg/v1/clip.jpg',
      fn:       getVideoFrameUrl,
    },
    {
      label:    'video frame: URL with query string',
      input:    'https://res.cloudinary.com/x/video/upload/clip.mp4?v=2',
      expected: 'https://res.cloudinary.com/x/video/upload/so_1,w_1200,f_jpg/clip.jpg?v=2',
      fn:       getVideoFrameUrl,
    },
    {
      label:    'video frame: non-Cloudinary URL untouched',
      input:    'https://example.com/video.mp4',
      expected: 'https://example.com/video.mp4',
      fn:       getVideoFrameUrl,
    },
  
    // ---- getPdfPreviewUrl ----
    {
      label:    'pdf preview: standard pdf URL',
      input:    'https://res.cloudinary.com/dqdku88vv/image/upload/v123/marble-sinks/intake/plans.pdf',
      expected: 'https://res.cloudinary.com/dqdku88vv/image/upload/pg_1,w_1200,f_jpg/v123/marble-sinks/intake/plans.jpg',
      fn:       getPdfPreviewUrl,
    },
    {
      label:    'pdf preview: with query string',
      input:    'https://res.cloudinary.com/x/image/upload/plans.pdf?cb=1',
      expected: 'https://res.cloudinary.com/x/image/upload/pg_1,w_1200,f_jpg/plans.jpg?cb=1',
      fn:       getPdfPreviewUrl,
    },
    {
      label:    'pdf preview: non-Cloudinary URL untouched',
      input:    'https://example.com/file.pdf',
      expected: 'https://example.com/file.pdf',
      fn:       getPdfPreviewUrl,
    },
  
    // ---- getResizedImageUrl (default 400x400) ----
    {
      label:    'resize: default 400x400',
      input:    'https://res.cloudinary.com/dqdku88vv/image/upload/v123/marble-sinks/intake/photo.jpg',
      expected: 'https://res.cloudinary.com/dqdku88vv/image/upload/w_400,h_400,c_fill/v123/marble-sinks/intake/photo.jpg',
      fn:       (u) => getResizedImageUrl(u),
    },
    {
      label:    'resize: non-Cloudinary URL untouched',
      input:    'https://example.com/photo.jpg',
      expected: 'https://example.com/photo.jpg',
      fn:       (u) => getResizedImageUrl(u),
    },
  ];
  
  let passed = 0;
  let failed = 0;
  
  console.log('\n== cloudinary.ts test run ==\n');
  
  for (const c of cases) {
    const actual = c.fn(c.input);
    const ok = actual === c.expected;
    if (ok) {
      passed++;
      console.log('PASS  ' + c.label);
    } else {
      failed++;
      console.log('FAIL  ' + c.label);
      console.log('      input:    ' + c.input);
      console.log('      expected: ' + c.expected);
      console.log('      actual:   ' + actual);
    }
  }
  
  // Resize with custom dimensions
  const customResized = getResizedImageUrl('https://res.cloudinary.com/x/image/upload/photo.jpg', 800, 600);
  const customExpected = 'https://res.cloudinary.com/x/image/upload/w_800,h_600,c_fill/photo.jpg';
  if (customResized === customExpected) {
    passed++;
    console.log('PASS  resize: custom 800x600 dimensions');
  } else {
    failed++;
    console.log('FAIL  resize: custom 800x600 dimensions');
    console.log('      expected: ' + customExpected);
    console.log('      actual:   ' + customResized);
  }
  
  console.log('\nResult: ' + passed + ' passed, ' + failed + ' failed (' + (cases.length + 1) + ' total)\n');
  
  console.log('Configuration check:');
  console.log('  cloudName: ' + (CLOUDINARY_CONFIG.cloudName || '(empty - check .env.local)'));
  console.log('  preset:    ' + (CLOUDINARY_CONFIG.preset    || '(empty - check .env.local)'));
  console.log('  configured: ' + (isCloudinaryConfigured() ? 'YES' : 'NO'));
  
  if (failed > 0 && typeof process !== 'undefined') {
    process.exit(1);
  }