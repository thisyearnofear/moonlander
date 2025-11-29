# Moonlander [[play here](https://tblazevic.github.io/moonlander)]

## 🚀 On-Chain Gaming on Monad

This implementation features **full blockchain integration** with on-chain payments and immutable leaderboard:

- 🎮 **Play-to-contribute**: Pay 100k m00nad per game
- 🔥 **Auto-burning**: 80% of payments permanently burned  
- 📈 **Platform revenue**: 20% to developers via 0xSplits
- 🏆 **On-chain leaderboard**: Scores stored as blockchain events
- 🔐 **No backend needed**: Everything runs on-chain

## Gameplay

This game was inspired by [Lunar Lander](https://en.wikipedia.org/wiki/Lunar_Lander_(1979_video_game)).  
The player controls lander rotation and thrusters in order to safely land on the surface.  
The player can land on marked areas to earn extra points and fuel.  
The game goes on until no fuel is remaining.

![game](./images/start.png "game")  

## Technologies used

The game is written in JavaScript and runs entirely on the client side.  
[Threejs](https://github.com/mrdoob/three.js/) is used for rendering and running the game requires a WebGL enabled browser.

## Project architecture

* `constants.js` - game, ui and particle parameters
* `globals.js` - global variables
* `terrainData.js` - terrain points
* `sound.js` - sound effects
* `hud.js` - HUD code
* `particles.js` - particle systems
* `main.js` - main game functionality

## The lander, terrain and camera

The lander itself is a quad with a texture.
Using thrusters does not directly change velocity or acceleration, but [jerk](https://en.wikipedia.org/wiki/Jerk_(physics)), in order to have smoother landings.
Horizontal speed is slightly decreasing to enable strategic decisions regarding fuel consumption.
Vertical speed is only affected by gravity.

The lander is spawned randomly, with a random horizontal speed forcing the player to use some more fuel before attempting to land.

The terrain is defined through an array of points.
Between each pair of points, a quad is positioned, rotated and scaled to connect the two points.

Once the altitude drops below a certain threshold, the camera zooms in and follows the center point between the lander and terrain directly below.
It makes the game less static and helps with landing.

## Collision detection

The shape of the lander is approximated with 3 circles which makes collision detection easier due to rotation.  
Each circle is checked against every line segment defined by the terrain (basic circle-line intersection).

![lander](./images/normal.png "lander")  

![colliders](./images/colliders.png "colliders")

Upon collision, the landing is safe if 4 conditions are met:

* velocity magnitude must not be too high
* rotation angle must not be too high
* landing terrain must have a slope of 0
* both landing legs must be grounded

## HUD

The HUD is made with a separate scene and camera which are additively rendered on top of the world scene and world camera.
It contains score and fuel information on the left, lander parameters on the right and some basic information in the middle.
Bonus markings are rendered in world space.

![landing](./images/landing.png "landing")

## Particle systems

One particle system is attached to the thruster and it emits particles in a cone.  
The other one creates a circular explosion when the player crashes.

![thruster](./images/thruster.png "thruster")

![explosion](./images/explosion.png "explosion")

## Audio

Audio is played through the HTML5 audio element.
There are 4 sounds in the game:

* `crash.mp3` - played on crash
* `morse.mp3` - randomly played every x seconds
* `alarm.mp3` - played every x seconds once the next crash means game over
* `rocket.mp3` - looped while using thrusters

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

### Quick Reference
- **[GETTING_STARTED.md](docs/GETTING_STARTED.md)** - 5-step quick start, basic setup, overview
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** - Detailed deployment instructions for Farcaster + Monad
- **[TECHNICAL_DETAILS.md](docs/TECHNICAL_DETAILS.md)** - Architecture, smart contracts, security model

### Ready-to-Deploy Files
- **`contracts/MoonlanderGame.sol`** - Smart contract (180 lines)
- **`js/contract-integration.js`** - Frontend blockchain integration (600 lines)
- **`js/contract-abis.js`** - Contract ABIs and utilities (250 lines)

### What You'll Get
✅ **Complete on-chain gaming platform**  
✅ **< 2 hours to launch**  
✅ **< $1 in gas costs**  
✅ **Audited smart contracts** (0xSplits)  
✅ **No backend required**  

### Start Here
1. Read **[GETTING_STARTED.md](docs/GETTING_STARTED.md)** for the 30-second overview
2. Follow **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** for step-by-step instructions
3. Understand the tech in **[TECHNICAL_DETAILS.md](docs/TECHNICAL_DETAILS.md)**

---

## ⚡ Quick Deploy

Deploy on-chain in 5 steps (~40 minutes):

```bash
# 1. Deploy 0xSplits (split.new) - 5 min
# 2. Deploy contract (Remix) - 15 min  
# 3. Update config - 10 min
# 4. Test locally - 20 min
# 5. Deploy to Vercel - 10 min
```

**Total**: ~1 hour | **Cost**: < $1

---

*For complete implementation guide, see [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)*
