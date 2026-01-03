# 🔐 Persian Text Encryption App

A complete web-based text encryption application with Persian language support and beautiful UI using Vazirmatn font.

## 🌟 Quick Start (English)

### Installation
```bash
# Clone or download the project
cd cryptography

# Option 1: Open directly
# Just open index.html in your browser

# Option 2: With local server
python -m http.server 8000
# or
npx http-server -p 8000

# Then visit: http://localhost:8000
```

### Usage
1. **Encrypt**: Enter text, choose a password (8+ chars), select character types, click encrypt
2. **Decrypt**: Paste encrypted text, enter the same password, click decrypt
3. **History**: View and manage all your encrypted texts

## 🎯 Key Features

- **Military-grade encryption**: AES-256-GCM
- **Key derivation**: PBKDF2 with 100,000 iterations
- **Character type selection**: Persian, English, Numbers, Symbols
- **Local storage**: IndexedDB for history
- **No server needed**: Everything runs in browser
- **Privacy first**: No data sent anywhere
- **Beautiful UI**: Modern design with Persian font
- **Fully responsive**: Works on mobile and desktop

## 📂 Project Structure

```
cryptography/
├── index.html              # Main application
├── test.html               # Automated tests
├── showcase.html           # Project showcase
├── README.md               # Full documentation (Persian)
├── README_EN.md            # This file (English)
├── LICENSE                 # MIT License
├── download-fonts.ps1      # Font download script
│
└── assets/
    ├── css/
    │   └── style.css       # Complete styling
    ├── js/
    │   ├── app.js          # Main application logic
    │   ├── crypto.js       # Encryption module
    │   └── storage.js      # Storage module
    └── fonts/
        └── README.md       # Font installation guide
```

## 🔒 Security

### Algorithms Used
- **AES-256-GCM**: Authenticated encryption
- **PBKDF2**: Password-based key derivation
- **SHA-256**: Hash function for PBKDF2
- **Random Salt**: 16 bytes per encryption
- **Random IV**: 12 bytes per encryption

### Security Notes
⚠️ **Important**: Without the password, decryption is impossible!

- Use strong passwords (12+ characters recommended)
- Store passwords securely
- Never send password with encrypted text
- Share password through secure channel (phone call, in-person)
- All operations happen in browser
- No data sent to any server

## 💻 Technology Stack

- **HTML5**: Structure
- **CSS3**: Styling with Grid, Flexbox, Animations
- **JavaScript ES6+**: Logic
- **Web Crypto API**: Encryption
- **IndexedDB API**: Local storage
- **Vazirmatn Font**: Persian typography
- **Zero dependencies**: No external libraries!

## 🌐 Browser Support

✅ Chrome 60+
✅ Firefox 55+
✅ Safari 11+
✅ Edge 79+
✅ Opera 47+

## 📊 Statistics

- **2,500+** lines of code
- **10+** files
- **0** dependencies
- **100%** client-side
- **256-bit** encryption
- **5+** browsers supported

## 🧪 Testing

Run automated tests:
```bash
# Open test.html in browser
# Tests will run automatically
```

Tests include:
- Encryption/decryption
- Wrong password detection
- Input validation
- Long text handling
- Persian text support
- Character set encoding

## 🎨 Customization

### Change Colors
Edit `assets/css/style.css`:
```css
:root {
    --primary-color: #6366f1;  /* Main color */
    --secondary-color: #8b5cf6; /* Secondary color */
}
```

### Change Security Settings
Edit `assets/js/crypto.js`:
```javascript
this.iterations = 100000;  // PBKDF2 iterations
```

### Add Character Sets
Edit `assets/js/crypto.js`:
```javascript
this.charsets = {
    // Add your custom charset
    custom: 'YourCustomCharacters123'
};
```

## 📖 Documentation

### For Persian Speakers
- `README.md` - Complete guide in Persian
- `QUICKSTART.md` - Quick start guide
- `EXAMPLES.md` - Usage examples
- `CONFIGURATION.md` - Advanced configuration
- `CHEATSHEET.md` - Quick reference card
- `PROJECT_SUMMARY.md` - Project summary

### For Developers
- `README_EN.md` - This file
- Code comments are in English
- Function names are in English
- UI is in Persian

## 🚀 Use Cases

1. **Secure SMS**: Send sensitive info via SMS
2. **Password Storage**: Encrypt and store passwords
3. **Bank Information**: Share bank details securely
4. **Verification Codes**: Send codes safely
5. **Personal Notes**: Encrypt private notes
6. **Confidential Communication**: Business secrets
7. **Medical Information**: Health records
8. **Legal Documents**: Contracts and agreements

## 🔧 API Reference

### CryptoManager

```javascript
// Encrypt text
const encrypted = await cryptoManager.encrypt(plainText, password);

// Decrypt text
const decrypted = await cryptoManager.decrypt(cipherText, password);

// Encode to specific charset
const encoded = cryptoManager.encodeToCharset(cipherText, ['persian', 'numbers']);

// Decode from charset
const decoded = cryptoManager.decodeFromCharset(encodedText);

// Validate password
cryptoManager.validatePassword(password); // throws if invalid

// Validate text
cryptoManager.validateText(text); // throws if invalid
```

### StorageManager

```javascript
// Save to history
await storageManager.saveHistory({
    plainText: "Original text",
    cipherText: "Encrypted text",
    displayText: "Display text",
    charsets: ["persian", "numbers"]
});

// Get all history
const history = await storageManager.getAllHistory();

// Delete item
await storageManager.deleteHistory(id);

// Clear all
await storageManager.clearAllHistory();

// Get count
const count = await storageManager.getHistoryCount();
```

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

MIT License - see LICENSE file for details

Font: Vazirmatn by Saber Rastikerdar (OFL License)

## 🐛 Known Issues

None at this time. If you find any, please report them.

## 🎯 Future Enhancements

- [ ] File encryption
- [ ] Image encryption
- [ ] QR Code sharing
- [ ] Random password generator
- [ ] Dark mode
- [ ] PWA support
- [ ] Export/import history
- [ ] Multi-language support

## 💡 Tips

### For Best Security
1. Use 12+ character passwords
2. Mix uppercase, lowercase, numbers, symbols
3. Don't reuse passwords
4. Store passwords in password manager
5. Never share password with encrypted text

### For Best Experience
1. Use modern browser
2. Download fonts for faster loading
3. Enable JavaScript
4. Allow IndexedDB for history
5. Use secure connection (HTTPS)

## 📞 Support

For questions or issues:
1. Check README.md (Persian documentation)
2. Run test.html to verify functionality
3. Check browser console for errors
4. Ensure browser supports Web Crypto API

## 🌍 Localization

Currently available in Persian. UI text can be translated by editing:
- `index.html` - UI labels
- `assets/js/app.js` - Messages and toasts

## 🏆 Credits

- **Encryption**: Web Crypto API (W3C Standard)
- **Font**: Vazirmatn by Saber Rastikerdar
- **Design**: Custom modern design
- **Icons**: Emoji

## 📈 Performance

- **Encryption speed**: < 1 second for most texts
- **Decryption speed**: < 1 second for most texts
- **Storage**: IndexedDB (async, non-blocking)
- **Bundle size**: ~3KB HTML + ~30KB CSS + ~15KB JS (unminified)

## 🔐 Cryptographic Details

### Encryption Process
```
1. User enters password and text
2. Generate random 16-byte salt
3. Derive key using PBKDF2(password, salt, 100000, SHA-256)
4. Generate random 12-byte IV
5. Encrypt text using AES-256-GCM(text, key, IV)
6. Concatenate: salt + IV + ciphertext
7. Encode to Base64
8. Optionally encode to custom charset
```

### Decryption Process
```
1. User enters password and encrypted text
2. Decode from custom charset (if used)
3. Decode from Base64
4. Extract salt (first 16 bytes)
5. Extract IV (next 12 bytes)
6. Extract ciphertext (remaining bytes)
7. Derive key using PBKDF2(password, salt, 100000, SHA-256)
8. Decrypt using AES-256-GCM(ciphertext, key, IV)
9. Return plaintext
```

### Why These Choices?

- **AES-256-GCM**: Industry standard, authenticated encryption
- **PBKDF2**: Prevents brute force attacks on passwords
- **100,000 iterations**: OWASP recommended minimum
- **Random salt**: Prevents rainbow table attacks
- **Random IV**: Ensures same text + password = different output

## 🎓 Learning Resources

To understand the cryptography:
- [Web Crypto API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [OWASP Cryptographic Storage](https://cheatsheetseries.owasp.org/cheatsheets/Cryptographic_Storage_Cheat_Sheet.html)
- [AES-GCM - Wikipedia](https://en.wikipedia.org/wiki/Galois/Counter_Mode)
- [PBKDF2 - Wikipedia](https://en.wikipedia.org/wiki/PBKDF2)

---

**Made with ❤️ for secure communication**

**Persian Text Encryption App v1.0.0**

