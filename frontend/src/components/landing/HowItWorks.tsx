'use client';

import { motion } from 'framer-motion';
import { CardCharacter, type CharacterKey, type AnchorPosition, type AnimationType } from '@/components/ui/CardCharacter';

// Character assignments for specific step cards
const stepCharacters: Record<number, {
  character: CharacterKey;
  anchor: AnchorPosition;
  animation: AnimationType;
  size: number;
  offsetX?: number;
  offsetY?: number;
  flipX?: boolean;
}> = {
  0: { // Accept the L - Doomer/Wojack (right 25%, up 30%)
    character: 'doomerManhole',
    anchor: 'bottom-center',
    animation: 'pop-up',
    size: 35,
    offsetX: 25,
    offsetY: -30,
  },
  1: { // Secure the Card - Pikachu peek (down 17%)
    character: 'pikaPeeking',
    anchor: 'top-center',
    animation: 'peek',
    size: 28,
    offsetY: 22,
  },
  2: { // Collect the Bag - Pepe chill (down 19%)
    character: 'pepeChill',
    anchor: 'top-center',
    animation: 'pop-up',
    size: 35,
    offsetY: 24,
  },
  3: { // Hold the Line - Luffy peeking (down 14%)
    character: 'onePeek',
    anchor: 'top-left',
    animation: 'slide-in',
    size: 40,
    offsetX: -5,
    offsetY: 19,
  },
};

const steps = [
  {
    number: '01',
    title: 'Accept the L',
    description: 'You missed Bitcoin. You missed Nvidia. You\'re here because you\'re hungry. Hunger is clarity.',
  },
  {
    number: '02',
    title: 'Secure the Card',
    description: 'Mint the EBT Card. It\'s your passport. Without it, you\'re just watching from the lobby.',
  },
  {
    number: '03',
    title: 'Collect the Bag',
    description: 'Tokens deposit to your card automatically. Monthly drops. No action required. Just wait.',
  },
  {
    number: '04',
    title: 'Hold the Line',
    description: 'If your early we feast, protocol handles the exit liquidity provisioning so losers can leave whenever and we stay liquid and well fed.',
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 relative overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-heading text-ebt-gold mb-4 tracking-wide">
            THE PATH
          </h2>
          <p className="text-xl text-gray-400">
            Four steps to supplemental nutrition.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step, index) => {
            const characterConfig = stepCharacters[index];
            return (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                className="relative"
                style={{ overflow: 'visible' }}
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-12 left-full w-full h-px bg-gradient-to-r from-ebt-gold/50 to-transparent z-0" />
                )}

                {/* Character attachment */}
                {characterConfig && (
                  <CardCharacter
                    character={characterConfig.character}
                    anchor={characterConfig.anchor}
                    animation={characterConfig.animation}
                    size={characterConfig.size}
                    offsetX={characterConfig.offsetX}
                    offsetY={characterConfig.offsetY}
                    flipX={characterConfig.flipX}
                    animationDelay={index * 0.15 + 0.3}
                    zIndex={20}
                  />
                )}

                <div className="relative z-10 bg-black/80 backdrop-blur-sm border border-ebt-gold/20 rounded-xl p-6 h-full">
                  <div className="text-5xl font-heading text-ebt-gold/30 mb-4">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-heading text-white mb-2 tracking-wide">
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-400">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Disclaimer */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          viewport={{ once: true }}
          className="text-center mt-16"
        >
          <div className="relative bg-black/80 backdrop-blur-sm border border-welfare-red/30 rounded-xl p-6 max-w-3xl mx-auto" style={{ overflow: 'visible' }}>
            {/* Boomer peeking from the side of disclaimer (left 5%) */}
            <CardCharacter
              character="boomerLooking"
              anchor="right-center"
              animation="slide-in"
              size={18}
              offsetX={-5}
              animationDelay={0.7}
              zIndex={20}
            />
            <p className="text-lg font-heading text-welfare-red mb-4 tracking-wide">
              THE FINE PRINT
            </p>
            <p className="text-sm text-gray-500">
              This is not financial advice. This is financial destiny. If you lose money, you simply lacked the vision.
              We are not a government agency. We are a functional protocol...Barely. So yada yada yada... NFA. DYOR. Touch grass and all that jazz.
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
