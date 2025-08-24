# Mobile Games Tests

This document describes the Playwright mobile tests for Par/Impar and Twin Words games that ensure mobile layout compliance and correct game logic.

## Test Coverage

### Viewports Tested
- **Mobile Small**: 360x800 (common Android phones)
- **Mobile Medium**: 375x812 (iPhone 12/13/14 standard)

### Tests Included

#### 1. Par/Impar Mobile Tests
- ✅ **Layout Validation**: No horizontal overflow on first paint
- ✅ **Cell Sizing**: Minimum cell size ≥ 56px and font size ≥ 24px
- ✅ **Gameplay**: Complete a short game run and reach summary
- ✅ **Screenshots**: Captures idle, in-game, and summary states

#### 2. Twin Words Mobile Tests
- ✅ **Layout Validation**: No horizontal overflow on first paint
- ✅ **Card Sizing**: Minimum card size ≥ 56px and font size ≥ 24px
- ✅ **Round Logic**: Verify rounds only advance when ALL incorrect pairs found
- ✅ **Spanish UI**: Validates "Marca las palabras DIFERENTES" instruction
- ✅ **Screenshots**: Captures idle, in-game, and completion states

## Running Tests

### Local Development
```bash
# Run all mobile tests
npm run test:mobile

# Run with browser visible (headed mode)
npm run test:mobile:headed

# Debug mode (step through)
npm run test:mobile:debug

# Run specific viewport
npx playwright test mobile-games.spec.js --project="Mobile Games - Small"
```

### CI Integration
The tests are configured to run automatically in CI via `.github/workflows/mobile-ci.yml`:

- Runs on push to `main` and `develop` branches
- Runs on pull requests to `main`
- Fails CI if mobile layout regressions are detected
- Fails CI if Twin Words round completion logic is broken
- Uploads screenshots for visual regression comparison

## Test Assertions

### Critical Failures
Tests will **fail CI** if any of these conditions are met:

1. **Horizontal Overflow**: Any game shows horizontal scrollbar on mobile
2. **Undersized Elements**: Cells/cards smaller than 56px or font smaller than 24px
3. **Twin Words Logic Error**: Round advances before all incorrect pairs are found
4. **Twin Words Logic Error**: Round fails to advance after all incorrect pairs are found

### Screenshots for Regression Detection
Automatic screenshots are captured at key states:
- `*-idle-{width}x{height}.png`: Game ready/intro state
- `*-ingame-{width}x{height}.png`: Active gameplay
- `*-summary-{width}x{height}.png`: Game completion (Par/Impar)
- `*-completed-{width}x{height}.png`: Round completion (Twin Words)

## Mobile-Specific Validations

### Par/Impar Game
- GameTopBar shows correctly on mobile
- Number grid uses responsive sizing
- Touch targets meet minimum accessibility standards
- Spanish instructions display properly
- Game progression works with touch interaction

### Twin Words Game  
- Word cards are properly sized for mobile viewing
- Spanish instruction "Marca las palabras DIFERENTES" is visible
- Progress indicator "Encontrados: X/Y" updates correctly
- Round completion logic enforces finding ALL incorrect pairs
- Touch interaction works smoothly

## Debugging Failed Tests

### Layout Issues
If tests fail on layout:
1. Check console for overflow errors
2. Review screenshot artifacts in CI
3. Verify CSS grid/flexbox responsive behavior
4. Test manually on target viewport sizes

### Game Logic Issues
If Twin Words completion logic fails:
1. Verify pairs are generated with correct `identical` property
2. Check that only `!p.identical` pairs count as targets
3. Ensure progress tracking state updates correctly
4. Confirm round advancement only triggers when `foundTargets === totalTargets`

## Adding New Mobile Tests

To add tests for other games:
1. Add new test cases to `e2e/mobile-games.spec.js`
2. Follow the same pattern: layout validation → element sizing → gameplay → screenshots
3. Update CI workflow if new failure conditions are needed

## File Structure
```
e2e/
├── mobile-games.spec.js     # Main mobile tests
├── par-impar.spec.js        # Desktop Par/Impar tests
└── (other game tests)

.github/workflows/
└── mobile-ci.yml           # CI configuration

test-results/                # Generated screenshots
├── parimpar-idle-360x800.png
├── parimpar-ingame-360x800.png
├── twinwords-idle-375x812.png
└── (other test artifacts)
```

This test suite ensures the mobile gaming experience remains consistent and accessible across the supported viewport ranges.
