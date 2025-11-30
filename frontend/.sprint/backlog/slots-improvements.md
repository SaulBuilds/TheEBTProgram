# Slot Machine Improvements Backlog

## Animation & Visual Polish
- [ ] Improve spin animation - raise pieces up one row then smooth cascade down
- [ ] Add particle effects on wins (coins, sparkles)
- [ ] Add screen shake on big wins
- [ ] Improve wild multiplier visual feedback (show 2x, 4x, 8x growing)
- [ ] Add sound effects (spin, win, cascade, bonus trigger)
- [ ] Better grand win celebration animation

## Game Mechanics
- [ ] Implement Hold & Spin bonus fully (3 spins, coins stick, reset on new coin)
- [ ] Add mini/minor/major/mega/grand coin tiers for Hold & Spin
- [ ] Grand coin only appears as 25th coin (fill entire screen)
- [ ] Free spins retrigger with pepe_shopping symbol
- [ ] Sticky wilds that persist through free spins
- [ ] Progressive multiplier during free spins (grows with each cascade)

## Symbol & Theming
- [ ] Review symbol art - ensure all 25 regular + 4 special are distinct
- [ ] Add symbol descriptions/paytable modal
- [ ] Themed backgrounds for different bonus modes
- [ ] Symbol animations (idle bounce, win highlight)

## UI/UX Improvements
- [ ] Paytable/info modal showing all symbols and payouts
- [ ] Bet selector (if implementing real betting)
- [ ] Win history panel
- [ ] Better mobile responsiveness
- [ ] Landscape mode optimization
- [ ] Loading states and skeleton screens
- [ ] Better autoplay controls (stop on bonus, stop on big win)

## Stats & Persistence
- [ ] Show server stats vs session stats comparison
- [ ] Streak indicators and badges
- [ ] Achievement system (first grand win, 100 spins, etc.)
- [ ] Daily/weekly challenges
- [ ] Real-time leaderboard updates during play

## Performance
- [ ] Optimize image loading (sprite sheets)
- [ ] Reduce re-renders during animation
- [ ] Lazy load non-critical assets
- [ ] Service worker for offline play state

## Social Features
- [ ] Share big wins to Twitter
- [ ] Spectate other players
- [ ] Tournament mode
- [ ] Multiplayer bonus rounds

## Technical Debt
- [ ] Clean up unused grid state variable
- [ ] Consolidate animation logic
- [ ] Add proper TypeScript types for all game state
- [ ] Unit tests for game engine logic
- [ ] E2E tests for spin flow
