# Spiread - Speed Reading & Brain Training

Potencia tu velocidad de lectura y entrenamiento cerebral con técnicas científicamente probadas.

## Features

- **9 Brain Training Games**: Complete suite of cognitive training exercises
- **RSVP Speed Reading**: Advanced rapid serial visual presentation
- **Gamification System**: XP, levels, streaks, and achievements
- **AI-Powered Tools**: Text summarization and comprehension questions
- **Internationalization**: Full Spanish/English support
- **PWA Support**: Offline functionality and app installation
- **Accessibility**: Comprehensive a11y features including dyslexia support

## Games Available

### Original Games (5)
1. **RSVP Reader** - Speed reading with visual presentation
2. **Schulte Table** - Peripheral vision expansion
3. **Twin Words** - Word discrimination training
4. **Par/Impar** - Quick decision making under pressure
5. **Memory Digits** - Sequential digit memory training

### Phase 3 Games (4)
6. **Running Words** - 5-line word sequence memory (60s sessions)
7. **Letters Grid** - Target letter identification in grids
8. **Word Search** - Hidden word finding with drag selection
9. **Anagrams** - Timed word unscrambling with decoy letters

## Testing

This project includes comprehensive automated testing with Playwright and Lighthouse CI.

### Running Tests

```bash
# Install dependencies
yarn install

# Install Playwright browsers
npx playwright install

# Run all Playwright tests
yarn test

# Run tests with UI
yarn test:ui

# Run tests in headed mode
yarn test:headed

# Run Lighthouse CI
yarn lighthouse

# Run all tests (Playwright + Lighthouse)
yarn test:all
```

### Test Coverage

- **Games Grid Validation**: Verifies all 9 games display correctly
- **Game Navigation**: Tests game launching and 60s timer functionality
- **Internationalization**: ES/EN language switching
- **Gamification Header**: XP bar, level display, streak counter
- **Stats Panel**: Charts and progress tracking
- **Responsive Design**: Mobile, tablet, desktop layouts
- **Accessibility**: Keyboard navigation and screen reader support

### Lighthouse CI Thresholds

- Performance: ≥ 90
- PWA: ≥ 90
- Best Practices: ≥ 90
- Accessibility: ≥ 85
- SEO: ≥ 80 (warning only)

## Development

```bash
# Start development server
yarn dev

# Build for production
yarn build

# Start production server
yarn start
```

## Architecture

- **Frontend**: Next.js 14 with React 18
- **Styling**: Tailwind CSS with Radix UI components
- **State Management**: Zustand
- **Database**: Supabase (PostgreSQL)
- **AI Integration**: OpenAI GPT-4o-mini with Emergent LLM Key
- **Testing**: Playwright + Lighthouse CI
- **Deployment**: Kubernetes with ingress routing

## Data Test IDs

The application includes comprehensive data-testid attributes for reliable testing:

- `games-list` - Main games grid container
- `game-card-{key}` - Individual game cards (e.g., game-card-rsvp)
- `start-btn-{key}` - "Comenzar" buttons (e.g., start-btn-runningwords)
- `header-gamification` - Gamification header section
- `xp-bar` - XP progress bar
- `streak-badge` - Daily streak counter
- `lang-switch` - Language switcher
- `stats-chart` - Statistics chart container
- `session-runner` - Session runner component

## Game Keys

All games use consistent naming:
- `rsvp`, `schulte`, `twinwords`, `parimpar`, `memorydigits`
- `runningwords`, `lettersgrid`, `wordsearch`, `anagrams`

## Hotkeys

- **Space**: Pause/Resume games
- **Escape**: Exit to menu
- **Arrow Keys**: Navigate UI elements
- **Enter**: Select/Confirm actions

## Browser Support

- Chrome/Chromium (recommended)
- Firefox
- Safari
- Mobile Chrome
- Mobile Safari

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `yarn test:all`
5. Submit a pull request

## Database

### Schema Management

The application uses Supabase (PostgreSQL) with comprehensive schema management:

```bash
# Apply database migration
psql -d your_database -f supabase/migrations/20250614_fix_uuid_and_gamification.sql

# Verify database schema
psql -d your_database -f scripts/db-verify.sql
```

### Key Tables
- `profiles` - User XP, level, and progress tracking
- `achievements` - Gamification achievements with unique constraints
- `streaks` - Daily activity tracking for streaks
- `game_runs` - All game session data and metrics
- `session_schedules` - Structured training session templates
- `settings` - User preferences with JSON progress data

## Infrastructure

### Known Issues
- **502 Errors**: External routing through Kubernetes ingress experiences timeout issues
- **Local Development**: All functionality works perfectly on `localhost:3000`
- **Root Cause**: Infrastructure-level proxy timeouts and buffer configurations

See [Infrastructure Documentation](docs/infra/ingress-502.md) for detailed analysis and solutions.

## License

MIT License - see LICENSE file for details.