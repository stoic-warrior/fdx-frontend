import type { Wig } from "../../types";

interface WigSelectorProps {
  wigs: Wig[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

const WigSelector = ({ wigs, selectedIds, onToggle }: WigSelectorProps) => {
  if (!wigs.length) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {wigs.map((wig) => {
        const isSelected = selectedIds.includes(wig.id);
        return (
          <button
            key={wig.id}
            onClick={() => onToggle(wig.id)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              isSelected
                ? "bg-blue-600 text-white"
                : "border border-blue-200 bg-white text-blue-600 hover:bg-blue-50"
            }`}
          >
            {wig.title}
          </button>
        );
      })}
    </div>
  );
};

export default WigSelector;
