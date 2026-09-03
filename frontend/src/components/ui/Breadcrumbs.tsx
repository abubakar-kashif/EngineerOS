import type { ReactNode } from "react";
import { Link } from "react-router-dom";

type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
  separator?: ReactNode;
  className?: string;
};

function Breadcrumbs({ items, separator = "/", className = "" }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`ui-breadcrumbs ${className}`}>
      <ol className="ui-breadcrumbs-list">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={i} className="ui-breadcrumbs-item">
              {i > 0 && <span className="ui-breadcrumbs-separator" aria-hidden="true">{separator}</span>}
              {isLast || !item.href ? (
                <span className="ui-breadcrumbs-current" aria-current={isLast ? "page" : undefined}>
                  {item.label}
                </span>
              ) : (
                <Link to={item.href} className="ui-breadcrumbs-link">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export default Breadcrumbs;
