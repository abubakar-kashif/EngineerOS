import { Link } from "react-router-dom";
import { ArrowRight, Clock, FlaskConical } from "lucide-react";
import type { Experiment } from "../../types/experiment";

type ExperimentCardProps = {
  experiment: Experiment;
};

function ExperimentCard({
  experiment,
}: ExperimentCardProps) {
  const difficultyStyles = {
    Beginner:
      "border-emerald-200 bg-emerald-50 text-emerald-700",
    Intermediate:
      "border-amber-200 bg-amber-50 text-amber-700",
    Advanced:
      "border-rose-200 bg-rose-50 text-rose-700",
  };

  return (
    <Link
      to={`/experiments/${experiment.id}`}
      className="group block h-full"
    >
      <article
        className="
          flex h-[190px] flex-col
          rounded-xl
          border border-slate-200
          bg-white
          p-4
          shadow-[0_2px_10px_rgba(15,23,42,0.04)]
          transition-all duration-200
          hover:-translate-y-1
          hover:border-violet-200
          hover:shadow-[0_8px_24px_rgba(124,58,237,0.10)]
        "
      >
        {/* TOP */}
        <div className="flex items-start justify-between">
          <div
            className="
              flex h-12 w-12 shrink-0
              items-center justify-center
              rounded-xl
              bg-violet-50
              text-violet-600
            "
          >
            <FlaskConical size={24} strokeWidth={1.8} />
          </div>

          <ArrowRight
            size={20}
            strokeWidth={1.8}
            className="
              mt-1
              text-slate-300
              transition-all duration-200
              group-hover:translate-x-1
              group-hover:text-violet-600
            "
          />
        </div>

        {/* CONTENT */}
        <div className="mt-3 min-h-0">
          <h3
            className="
              truncate
              text-[17px]
              font-semibold
              leading-6
              text-slate-900
              group-hover:text-violet-700
            "
          >
            {experiment.title}
          </h3>

          <p
            className="
              mt-1
              line-clamp-2
              text-[13px]
              leading-5
              text-slate-500
            "
          >
            {experiment.short_description}
          </p>
        </div>

        {/* META */}
        <div className="mt-auto">
          <div className="mb-3 flex items-center gap-3">
            <span
              className={`
                rounded-md
                border
                px-2 py-0.5
                text-[11px]
                font-semibold
                ${difficultyStyles[experiment.difficulty]}
              `}
            >
              {experiment.difficulty}
            </span>

            <span className="flex items-center gap-1 text-[12px] text-slate-500">
              <Clock size={14} />
              {experiment.duration_minutes} min
            </span>
          </div>

          {/* BOTTOM */}
          <div
            className="
              border-t border-slate-100
              pt-2
              text-[13px]
              font-semibold
              text-violet-600
            "
          >
            Open Experiment
            <span className="ml-1 transition-transform group-hover:translate-x-1 inline-block">
              →
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

export default ExperimentCard;