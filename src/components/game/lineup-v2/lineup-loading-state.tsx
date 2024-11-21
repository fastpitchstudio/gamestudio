import { motion } from "framer-motion";

interface LineupLoadingStateProps {
  message?: string;
}

export const LineupLoadingState = ({ message = "Loading lineup..." }: LineupLoadingStateProps) => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-[600px] bg-gray-50 rounded-lg">
      <motion.div
        className="w-16 h-16 border-4 border-primary rounded-full"
        animate={{
          rotate: 360,
          borderTopColor: "transparent",
          borderRightColor: "transparent",
        }}
        transition={{
          duration: 1,
          ease: "linear",
          repeat: Infinity,
        }}
      />
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
    </div>
  );
};
