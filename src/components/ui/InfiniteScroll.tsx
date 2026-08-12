'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';

export default function InfiniteScroll({ 
  children, 
  speed = 40,
  direction = 'left' 
}: { 
  children: ReactNode, 
  speed?: number,
  direction?: 'left' | 'right' 
}) {
  return (
    <div className="flex overflow-hidden relative w-full group">
      <motion.div
        className="flex whitespace-nowrap min-w-full"
        animate={{
          x: direction === 'left' ? ['0%', '-50%'] : ['-50%', '0%'],
        }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: speed,
        }}
      >
        <div className="flex shrink-0 w-full justify-around items-center gap-8 px-4">
          {children}
        </div>
        <div className="flex shrink-0 w-full justify-around items-center gap-8 px-4">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
