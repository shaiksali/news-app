#!/bin/bash

# ─── GNews App Quick Setup Script ───────────────────────────────────────────
echo "🚀 GNews App Setup"
echo "===================="

# Backend
echo ""
echo "📦 Installing backend dependencies..."
cd backend && npm install
cd ..

# Frontend
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend && npm install
cd ..

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo ""
echo "  1. Add your GNews API key:"
echo "     cd backend && cp .env.example .env"
echo "     Then edit .env and set GNEWS_API_KEY=your_key_here"
echo ""
echo "  2. Start the backend:"
echo "     cd backend && npm run dev"
echo ""
echo "  3. In a new terminal, start Expo:"
echo "     cd frontend && npx expo start"
echo ""
echo "  4. (Android only) Update API_BASE_URL in frontend/src/utils/config.js:"
echo "     Change 'localhost' to '10.0.2.2' for Android emulator"
echo ""
echo "  5. Scan the QR code with Expo Go or press 'i'/'a' for simulator"
echo ""
echo "Happy coding! 🎉"
