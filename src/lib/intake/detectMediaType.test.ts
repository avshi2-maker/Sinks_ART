/**
 * detectMediaType.test.ts
 *
 * Standalone test cases for detectMediaType.ts.
 * Run via: npx tsx src/lib/intake/detectMediaType.test.ts
 *
 * Phase 15 — Multi-Format Media Intake
 * Created: 03/05/2026
 */

import {
    detectMediaTypeFromUrl,
    detectMediaTypeFromFile,
    detectMediaType,
    MediaType,
    MEDIA_TYPE_LABEL_HE,
    MEDIA_TYPE_ICON,
  } from './detectMediaType';
  
  interface Case {
    label: string;
    input: string | File;
    expected: MediaType;
  }
  
  function fakeFile(name: string, mimeType: string): File {
    return new File(['x'], name, { type: mimeType });
  }
  
  const cases: Case[] = [
    // YouTube
    { label: 'YouTube short link',          input: 'https://youtu.be/dQw4w9WgXcQ',                      expected: 'youtube' },
    { label: 'YouTube standard link',       input: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',       expected: 'youtube' },
    { label: 'YouTube mobile link',         input: 'https://m.youtube.com/watch?v=dQw4w9WgXcQ',         expected: 'youtube' },
    { label: 'YouTube uppercase variation', input: 'HTTPS://YOUTUBE.COM/watch?v=test',                  expected: 'youtube' },
  
    // Instagram
    { label: 'Instagram post',              input: 'https://www.instagram.com/p/CxYzABC123/',           expected: 'instagram' },
    { label: 'Instagram reel',              input: 'https://instagram.com/reel/CxYzABC123/',            expected: 'instagram' },
  
    // Direct file URLs
    { label: 'Cloudinary jpg URL',          input: 'https://res.cloudinary.com/x/image/upload/abc.jpg', expected: 'photo' },
    { label: 'png with query string',       input: 'https://example.com/sink.png?v=2',                  expected: 'photo' },
    { label: 'mp4 URL',                     input: 'https://example.com/clip.mp4',                      expected: 'mp4' },
    { label: 'pdf URL',                     input: 'https://example.com/plans.pdf',                     expected: 'pdf' },
    { label: 'webm URL',                    input: 'https://example.com/clip.webm',                     expected: 'mp4' },
    { label: 'heic URL (iPhone)',           input: 'https://example.com/photo.HEIC',                    expected: 'photo' },
  
    // Generic web links
    { label: 'Design blog URL',             input: 'https://dwell.com/article/marble-sinks-trends',     expected: 'url' },
    { label: 'Pinterest URL',               input: 'https://pinterest.com/pin/123/',                    expected: 'url' },
  
    // File uploads (MIME types)
    { label: 'JPEG file with MIME',         input: fakeFile('photo.jpg',    'image/jpeg'),              expected: 'photo' },
    { label: 'PNG file with MIME',          input: fakeFile('photo.png',    'image/png'),               expected: 'photo' },
    { label: 'PDF file with MIME',          input: fakeFile('plans.pdf',    'application/pdf'),         expected: 'pdf' },
    { label: 'MP4 file with MIME',          input: fakeFile('clip.mp4',     'video/mp4'),               expected: 'mp4' },
    { label: 'MOV file with MIME',          input: fakeFile('clip.mov',     'video/quicktime'),         expected: 'mp4' },
  
    // Sketch detection
    { label: 'Sketch (English filename)',   input: fakeFile('my-sketch.jpg','image/jpeg'),              expected: 'sketch' },
    { label: 'Drawing (English)',           input: fakeFile('drawing.jpg',  'image/jpeg'),              expected: 'sketch' },
  
    // MIME-empty fallback
    { label: 'JPEG file with EMPTY MIME',   input: fakeFile('android.jpg',  ''),                        expected: 'photo' },
    { label: '3GP file with EMPTY MIME',    input: fakeFile('clip.3gp',     ''),                        expected: 'mp4' },
    { label: 'PDF file with EMPTY MIME',    input: fakeFile('doc.pdf',      ''),                        expected: 'pdf' },
  ];
  
  let passed = 0;
  let failed = 0;
  
  console.log('\n== detectMediaType.ts test run ==\n');
  
  for (const c of cases) {
    const actual = detectMediaType(c.input);
    const ok = actual === c.expected;
    const inputDisplay = typeof c.input === 'string'
      ? c.input
      : '[File: ' + c.input.name + ', mime="' + c.input.type + '"]';
    if (ok) {
      passed++;
      console.log('PASS  ' + c.label.padEnd(35) + ' -> ' + actual);
    } else {
      failed++;
      console.log('FAIL  ' + c.label.padEnd(35) + ' -> expected ' + c.expected + ', got ' + actual + '  [' + inputDisplay + ']');
    }
  }
  
  console.log('\nResult: ' + passed + ' passed, ' + failed + ' failed (' + cases.length + ' total)\n');
  
  const allTypes: MediaType[] = ['youtube', 'instagram', 'photo', 'sketch', 'mp4', 'pdf', 'url'];
  console.log('Label coverage:');
  for (const t of allTypes) {
    const labelOk = !!MEDIA_TYPE_LABEL_HE[t];
    const iconOk  = !!MEDIA_TYPE_ICON[t];
    console.log('  ' + t.padEnd(10) + ' label=' + (labelOk ? 'OK' : 'MISSING') + ' icon=' + (iconOk ? 'OK' : 'MISSING'));
  }
  
  if (failed > 0 && typeof process !== 'undefined') {
    process.exit(1);
  }