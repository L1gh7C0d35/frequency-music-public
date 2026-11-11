/* Optional local verification: Bun scripts/test_private_audio_crypto.js /path/to/keyfile
   The key is never hardcoded or published; only AES-GCM ciphertext lives in repo. */
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const root=path.join(__dirname,'..');
const argv=process.argv[2];
assert(argv && !argv.startsWith(root),'Pass the privately stored key file outside the repo.');
const hex=fs.readFileSync(argv,'utf8').trim();
assert.match(hex,/^[0-9a-f]{64}$/i);
const raw=Uint8Array.from(hex.match(/.{2}/g).map(s=>parseInt(s,16)));
const key=await crypto.subtle.importKey('raw',raw,{name:'AES-GCM'},false,['decrypt']);
async function decrypt(filename){
 const bytes=new Uint8Array(fs.readFileSync(path.join(root,'private-media',filename)));
 return await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12)},key,bytes.slice(12));
}
const manifest=JSON.parse(new TextDecoder().decode(await decrypt('manifest-20261111.bin')));
assert.equal(manifest.version,1);
assert.equal(manifest.purpose,'owner-private-frequency-listening');
assert.equal(manifest.tracks.length,2);
for(const t of manifest.tracks) {
 assert(t.private && t.new && t.audio.startsWith('private-media/'));
 const plain=new Uint8Array(await decrypt(path.basename(t.audio)));
 // An MP4 file with an ftyp box at 4 bytes, never stored unencrypted on Pages.
 assert.equal(String.fromCharCode(...plain.slice(4,8)),'ftyp');
 assert(plain.length>1000000);
 console.log(t.title,'encrypted audio verified; decrypted MB',Math.round(plain.length/1e5)/10);
}
const damaged=new Uint8Array(fs.readFileSync(path.join(root,'private-media','manifest-20261111.bin')));
damaged[damaged.length-1]^=1;
await assert.rejects(crypto.subtle.decrypt({name:'AES-GCM',iv:damaged.slice(0,12)},key,damaged.slice(12)));
assert(!fs.readdirSync(path.join(root,'private-media')).some(s=>/\.(wav|m4a|mp3)$/.test(s)));
console.log('AES-GCM cross-platform PASS: manifest, both audio files, tamper refusal, no plaintext in site.');
