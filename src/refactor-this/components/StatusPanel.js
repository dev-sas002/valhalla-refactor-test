import React from "react";

/**
 * Full-width message used for the empty and failed states, so neither shows
 * up as a silently blank grid.
 */
const StatusPanel = ({ tone = "info", title, children, action }) => (
  <div className={`status status--${tone}`} role="status">
    <h2 className="status__title">{title}</h2>
    {children ? <p className="status__body">{children}</p> : null}
    {action ? (
      <button type="button" className="status__action" onClick={action.onClick}>
        {action.label}
      </button>
    ) : null}
  </div>
);

export default StatusPanel;
