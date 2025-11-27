'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { formatEther, parseEther } from 'viem';
import {
  MIN_MINT_PRICE,
  MAX_MINT_PRICE,
  PRICE_PRECISION,
  BASE_TOKENS_PER_MIN_PRICE,
} from '@/lib/contracts/addresses';

interface PriceSelectorProps {
  /** Currently selected price in wei */
  value: bigint;
  /** Callback when price changes */
  onChange: (price: bigint) => void;
  /** Whether the selector is disabled */
  disabled?: boolean;
}

// Convert wei to ETH as number for slider
function weiToEthNumber(wei: bigint): number {
  return Number(formatEther(wei));
}

// Convert ETH number to wei (rounded to price precision)
function ethNumberToWei(eth: number): bigint {
  const precision = weiToEthNumber(PRICE_PRECISION);
  const rounded = Math.round(eth / precision) * precision;
  return parseEther(rounded.toString());
}

// Calculate tokens received for a given price
export function calculateTokensForPrice(price: bigint): bigint {
  return (price * BASE_TOKENS_PER_MIN_PRICE) / MIN_MINT_PRICE;
}

// Format token amount for display
function formatTokens(amount: bigint): string {
  const decimals = 18;
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  return whole.toLocaleString();
}

export function PriceSelector({ value, onChange, disabled = false }: PriceSelectorProps) {
  const minEth = weiToEthNumber(MIN_MINT_PRICE);
  const maxEth = weiToEthNumber(MAX_MINT_PRICE);
  const precisionEth = weiToEthNumber(PRICE_PRECISION);

  // Local state for the input field
  const [inputValue, setInputValue] = useState(formatEther(value));

  // Update input when value prop changes
  useEffect(() => {
    setInputValue(formatEther(value));
  }, [value]);

  // Handle slider change
  const handleSliderChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const ethValue = parseFloat(e.target.value);
      const weiValue = ethNumberToWei(ethValue);
      onChange(weiValue);
    },
    [onChange]
  );

  // Handle input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputVal = e.target.value;
      setInputValue(inputVal);

      // Only update parent if valid
      const ethValue = parseFloat(inputVal);
      if (!isNaN(ethValue) && ethValue >= minEth && ethValue <= maxEth) {
        const weiValue = ethNumberToWei(ethValue);
        onChange(weiValue);
      }
    },
    [onChange, minEth, maxEth]
  );

  // Handle input blur - validate and snap to precision
  const handleInputBlur = useCallback(() => {
    let ethValue = parseFloat(inputValue);

    // Clamp to bounds
    if (isNaN(ethValue) || ethValue < minEth) {
      ethValue = minEth;
    } else if (ethValue > maxEth) {
      ethValue = maxEth;
    }

    // Snap to precision
    const rounded = Math.round(ethValue / precisionEth) * precisionEth;
    const weiValue = parseEther(rounded.toFixed(3));
    onChange(weiValue);
    setInputValue(rounded.toFixed(3));
  }, [inputValue, minEth, maxEth, precisionEth, onChange]);

  // Quick select presets
  const presets = [
    { label: 'Min', value: MIN_MINT_PRICE },
    { label: '0.1 ETH', value: parseEther('0.1') },
    { label: '0.5 ETH', value: parseEther('0.5') },
    { label: '1 ETH', value: parseEther('1') },
    { label: 'Max', value: MAX_MINT_PRICE },
  ];

  const currentEth = weiToEthNumber(value);
  const tokensReceived = calculateTokensForPrice(value);
  const minTokens = calculateTokensForPrice(MIN_MINT_PRICE);

  // Calculate multiplier vs minimum
  const multiplier = Number(value) / Number(MIN_MINT_PRICE);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <label className="text-sm font-heading text-gray-400 tracking-wide">
          MINT PRICE
        </label>
        <span className="text-xs text-gray-500">
          {precisionEth.toFixed(3)} ETH increments
        </span>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={minEth}
          max={maxEth}
          step={precisionEth}
          value={currentEth}
          onChange={handleSliderChange}
          disabled={disabled}
          className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer disabled:cursor-not-allowed
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-6
            [&::-webkit-slider-thumb]:h-6
            [&::-webkit-slider-thumb]:bg-ebt-gold
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-moz-range-thumb]:w-6
            [&::-moz-range-thumb]:h-6
            [&::-moz-range-thumb]:bg-ebt-gold
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:border-0
            [&::-moz-range-thumb]:cursor-pointer"
        />
        {/* Min/Max labels */}
        <div className="flex justify-between mt-1">
          <span className="text-xs text-gray-600">{minEth} ETH</span>
          <span className="text-xs text-gray-600">{maxEth} ETH</span>
        </div>
      </div>

      {/* Input and display */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Amount (ETH)</label>
          <div className="relative">
            <input
              type="number"
              min={minEth}
              max={maxEth}
              step={precisionEth}
              value={inputValue}
              onChange={handleInputChange}
              onBlur={handleInputBlur}
              disabled={disabled}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg
                font-mono text-white text-lg
                focus:outline-none focus:ring-2 focus:ring-ebt-gold/50 focus:border-ebt-gold
                disabled:opacity-50 disabled:cursor-not-allowed
                [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
              ETH
            </span>
          </div>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">You Receive</label>
          <div className="px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg">
            <span className="font-heading text-ebt-gold text-lg tracking-wide">
              {formatTokens(tokensReceived)}
            </span>
            <span className="text-gray-500 text-sm ml-1">$EBTC</span>
          </div>
        </div>
      </div>

      {/* Quick presets */}
      <div className="flex gap-2 flex-wrap">
        {presets.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onChange(preset.value)}
            disabled={disabled}
            className={`px-3 py-1 text-xs font-mono rounded-full transition-colors
              ${value === preset.value
                ? 'bg-ebt-gold text-black'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }
              disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Info box */}
      <div className="p-3 bg-gray-900/50 border border-gray-800 rounded-lg">
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Contribution multiplier</span>
          <span className="text-white font-mono">{multiplier.toFixed(1)}x</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-400">Tokens vs minimum</span>
          <span className="text-ebt-gold font-mono">
            +{formatTokens(tokensReceived - minTokens)} extra
          </span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Higher contributions receive proportionally more $EBTC tokens.
          Formula: tokens = (price / {minEth}) x {formatTokens(minTokens)}
        </p>
      </div>
    </div>
  );
}

export default PriceSelector;
