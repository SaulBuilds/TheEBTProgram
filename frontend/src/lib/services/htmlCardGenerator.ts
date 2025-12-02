/**
 * HTML Card Generator
 *
 * Generates EBT Card as an interactive HTML file that:
 * 1. Displays the card with CRT/scanline effects
 * 2. Can read on-chain data dynamically
 * 3. Supports animations for OpenSea
 *
 * OpenSea displays HTML via the `animation_url` metadata field.
 */

import { pinToIPFS, cidToGatewayUrl } from './ipfs';

// Card dimensions
const CARD_WIDTH = 1586;
const CARD_HEIGHT = 1000;

export interface HTMLCardInput {
  tokenId: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  score: number;
  backgroundImageCid?: string; // IPFS CID for background image
  contractAddress: string;
  chainId: number;
  rpcUrl: string;
}

export interface HTMLCardResult {
  html: string;
  htmlBuffer: Buffer;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generate the HTML card
 */
export function generateHTMLCard(input: HTMLCardInput): HTMLCardResult {
  const {
    tokenId,
    userId,
    username,
    avatarUrl,
    score,
    backgroundImageCid,
    contractAddress,
    chainId,
    rpcUrl,
  } = input;

  // Background: either IPFS image or gradient fallback
  const backgroundStyle = backgroundImageCid
    ? `background-image: url('https://ipfs.io/ipfs/${backgroundImageCid}'); background-size: cover; background-position: center;`
    : `background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%);`;

  const avatarSrc = avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(username)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=${CARD_WIDTH}, height=${CARD_HEIGHT}">
  <title>EBT Card #${tokenId}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    @font-face {
      font-family: 'VT323';
      src: url('https://fonts.gstatic.com/s/vt323/v17/pxiKyp0ihIEF2isfFJU.woff2') format('woff2');
    }

    body {
      width: ${CARD_WIDTH}px;
      height: ${CARD_HEIGHT}px;
      overflow: hidden;
      font-family: 'VT323', 'Courier New', monospace;
      background: #000;
    }

    .card {
      position: relative;
      width: 100%;
      height: 100%;
      ${backgroundStyle}
    }

    /* Dark overlay for readability */
    .card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 30%, rgba(0,0,0,0.4) 70%, rgba(0,0,0,0.7) 100%);
      pointer-events: none;
    }

    /* CRT Scanlines */
    .scanlines {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: repeating-linear-gradient(
        0deg,
        rgba(0, 0, 0, 0.15) 0px,
        rgba(0, 0, 0, 0.15) 2px,
        transparent 2px,
        transparent 4px
      );
      pointer-events: none;
      z-index: 100;
    }

    /* CRT Flicker Animation */
    .crt-flicker {
      animation: flicker 0.15s infinite;
    }

    @keyframes flicker {
      0% { opacity: 0.97; }
      50% { opacity: 1; }
      100% { opacity: 0.98; }
    }

    /* Vignette */
    .vignette {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%);
      pointer-events: none;
      z-index: 99;
    }

    /* Card content */
    .content {
      position: relative;
      z-index: 10;
      padding: 40px;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    /* Gold border */
    .border {
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 4px solid #D4AF37;
      border-radius: 30px;
      pointer-events: none;
      z-index: 50;
    }

    /* Top section */
    .top-section {
      display: flex;
      align-items: flex-start;
      gap: 40px;
      flex: 1;
    }

    /* Avatar */
    .avatar-container {
      position: relative;
      width: 208px;
      height: 208px;
      flex-shrink: 0;
    }

    .avatar-border {
      position: absolute;
      top: 0;
      left: 0;
      width: 208px;
      height: 208px;
      background: #D4AF37;
      border-radius: 50%;
    }

    .avatar {
      position: absolute;
      top: 4px;
      left: 4px;
      width: 200px;
      height: 200px;
      border-radius: 50%;
      object-fit: cover;
      background: #333;
    }

    /* Info section */
    .info {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding-top: 20px;
    }

    .title {
      font-size: 64px;
      font-weight: bold;
      color: #D4AF37;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
      letter-spacing: 2px;
    }

    .token-id {
      font-size: 28px;
      color: #888;
    }

    .username {
      font-size: 36px;
      color: #fff;
      margin-top: 20px;
    }

    .score-label {
      font-size: 24px;
      color: #888;
      margin-top: 20px;
    }

    .score-value {
      font-size: 48px;
      color: #D4AF37;
      font-weight: bold;
    }

    /* Bottom bar */
    .bottom-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 120px;
      background: rgba(0,0,0,0.85);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 80px;
      z-index: 20;
    }

    .bottom-bar::before {
      content: '';
      position: absolute;
      top: 35px;
      left: 80px;
      width: 40%;
      height: 2px;
      background: #D4AF37;
      opacity: 0.5;
    }

    .ebt-text {
      font-size: 32px;
      color: #D4AF37;
      letter-spacing: 1px;
    }

    .program-text {
      font-size: 24px;
      color: #666;
    }

    /* Loading state */
    .loading {
      color: #D4AF37;
      font-size: 24px;
    }

    /* On-chain data indicator */
    .chain-indicator {
      position: absolute;
      top: 40px;
      right: 60px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #888;
      z-index: 60;
    }

    .chain-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #4ade80;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    /* Glitch effect on hover (for interactive version) */
    .card:hover .title {
      animation: glitch 0.3s ease;
    }

    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-2px, 2px); }
      40% { transform: translate(-2px, -2px); }
      60% { transform: translate(2px, 2px); }
      80% { transform: translate(2px, -2px); }
      100% { transform: translate(0); }
    }
  </style>
</head>
<body>
  <div class="card crt-flicker">
    <div class="scanlines"></div>
    <div class="vignette"></div>
    <div class="border"></div>

    <div class="content">
      <div class="chain-indicator">
        <div class="chain-dot"></div>
        <span>LIVE ON-CHAIN</span>
      </div>

      <div class="top-section">
        <div class="avatar-container">
          <div class="avatar-border"></div>
          <img class="avatar" src="${escapeHtml(avatarSrc)}" alt="Avatar" crossorigin="anonymous" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%23333%22 width=%22100%22 height=%22100%22/><text x=%2250%22 y=%2255%22 text-anchor=%22middle%22 fill=%22%23D4AF37%22 font-size=%2240%22>${escapeHtml(username.charAt(0).toUpperCase())}</text></svg>'">
        </div>

        <div class="info">
          <div class="title">EBT CARD</div>
          <div class="token-id" id="tokenId">#${tokenId}</div>
          <div class="username" id="username">${escapeHtml(username)}</div>
          <div class="score-label">WELFARE SCORE</div>
          <div class="score-value" id="score">${score}</div>
        </div>
      </div>
    </div>

    <div class="bottom-bar">
      <div class="ebt-text">ELECTRONIC BENEFITS TRANSFER</div>
      <div class="program-text">THE PROGRAM</div>
    </div>
  </div>

  <script>
    // On-chain data fetching (optional - for dynamic updates)
    const CONTRACT_ADDRESS = '${contractAddress}';
    const CHAIN_ID = ${chainId};
    const RPC_URL = '${rpcUrl}';
    const TOKEN_ID = ${tokenId};

    // EBTProgram ABI for tokenData
    const TOKEN_DATA_ABI = [{
      "inputs": [{"name": "tokenId", "type": "uint256"}],
      "name": "tokenData",
      "outputs": [
        {"name": "mintPrice", "type": "uint256"},
        {"name": "claimCount", "type": "uint256"},
        {"name": "lastClaimTime", "type": "uint256"},
        {"name": "reapplicationBaseAmount", "type": "uint256"},
        {"name": "reapplicationStatus", "type": "uint8"},
        {"name": "tgeClaimed", "type": "bool"}
      ],
      "stateMutability": "view",
      "type": "function"
    }];

    // Fetch on-chain data (runs if window.ethereum or fetch is available)
    async function fetchOnChainData() {
      try {
        // Encode the call data
        const functionSelector = '0x0c11dedd'; // tokenData(uint256)
        const encodedTokenId = TOKEN_ID.toString(16).padStart(64, '0');
        const data = functionSelector + encodedTokenId;

        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            method: 'eth_call',
            params: [{ to: CONTRACT_ADDRESS, data }, 'latest'],
            id: 1
          })
        });

        const result = await response.json();
        if (result.result && result.result !== '0x') {
          // Decode the result
          const hex = result.result.slice(2);
          const claimCount = parseInt(hex.slice(64, 128), 16);

          // Update UI with on-chain claim count
          const scoreEl = document.getElementById('score');
          if (scoreEl && claimCount > 0) {
            scoreEl.innerHTML += ' <span style="font-size: 24px; color: #888;">(' + claimCount + '/3 claims)</span>';
          }
        }
      } catch (e) {
        console.log('On-chain fetch optional:', e);
      }
    }

    // Run on load
    if (typeof fetch !== 'undefined') {
      fetchOnChainData();
    }
  </script>
</body>
</html>`;

  return {
    html,
    htmlBuffer: Buffer.from(html, 'utf-8'),
  };
}

/**
 * Generate HTML card and pin to IPFS
 */
export async function generateAndPinHTMLCard(input: HTMLCardInput): Promise<{
  htmlCid: string;
  htmlUrl: string;
  html: string;
}> {
  const { html, htmlBuffer } = generateHTMLCard(input);

  // Pin the HTML file to IPFS
  const pinResult = await pinToIPFS(htmlBuffer, {
    name: `ebt-card-${input.tokenId}.html`,
  });

  return {
    htmlCid: pinResult.cid,
    htmlUrl: pinResult.url,
    html,
  };
}
