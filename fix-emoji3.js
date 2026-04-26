#!/usr/bin/env node
const fs = require('fs');
const f = '/home/itziktdk/.openclaw/workspace/school-app/public/js/app.js';
let c = fs.readFileSync(f, 'utf8');

// ZWJ compound emoji that weren't caught by simple split
c = c.replace(/👩\u200D💼/g, "${icon('briefcase')}");
c = c.replace(/👨\u200D🏫/g, "${icon('academicCap')}");
c = c.replace(/👨\u200D👩\u200D👧/g, "${icon('familyParent')}");

// Also without ZWJ (some may have been pasted without)
c = c.replace(/👩💼/g, "${icon('briefcase')}");
c = c.replace(/👨🏫/g, "${icon('academicCap')}");
c = c.replace(/👨👩👧/g, "${icon('familyParent')}");

// Fix double-wrapped icon calls in template literals: '${icon(...)}'  should not have quotes
// Fix roleIcons that have quotes around template literal
c = c.replace(/teacher: '\$\{icon\('academicCap'\)\}'/g, "teacher: icon('academicCap')");
c = c.replace(/parent: '\$\{icon\('familyParent'\)\}'/g, "parent: icon('familyParent')");
c = c.replace(/admin: '\$\{icon\('briefcase'\)\}'/g, "admin: icon('briefcase')");

fs.writeFileSync(f, c);

const rem = c.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1FAFF}\u{2B50}\u{23F0}\u{2705}\u{274C}\u{2728}\u{267B}\u{26A0}\u{25B6}\u{25C0}\u{2B06}\u{2B07}\u{2699}\u{27A1}\u{2795}\u{23F3}\u{2B1B}\u{200D}]/gu);
if (rem) {
  const unique = [...new Set(rem)];
  console.log('Remaining:', unique);
  c.split('\n').forEach((l,i) => {
    if (/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F000}-\u{1FAFF}\u{200D}]/u.test(l))
      console.log(`  L${i+1}: ${l.trim().substring(0,120)}`);
  });
} else console.log('ALL EMOJI REMOVED from app.js!');
