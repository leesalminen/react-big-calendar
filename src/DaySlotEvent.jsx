import React from 'react';
import { findDOMNode } from 'react-dom';
import Selection, { getBoundsForNode } from './Selection';
import cn from 'classnames';
import dates from './utils/dates';
import { isSelected } from './utils/selection';
import localizer from './localizer'

import { notify } from './utils/helpers';
import { accessor } from './utils/propTypes';
import { accessor as get } from './utils/accessors';

import { DragSource } from 'react-dnd';

import ItemTypes from './utils/itemTypes';

const eventSource = {
  beginDrag(props) {
    return {
      event: props.event
    };
  }
};

function positionFromDate(date, min, step){
  return dates.diff(min, dates.merge(min, date), 'minutes')
}


function collect(connect, monitor) {
  return {
    connectDragSource: connect.dragSource(),
    isDragging: monitor.isDragging()
  };
}

function overlaps(event, events, { startAccessor, endAccessor }, last) {
  let eStart = get(event, startAccessor);
  let offset = last;

  function overlap(eventB){
    return dates.lt(eStart, get(eventB, endAccessor))
  }

  if (!events.length) return last - 1
  events.reverse().some(prevEvent => {
    if (overlap(prevEvent)) return true
    offset = offset - 1
  })

  return offset
}

let DaySlotEvent = React.createClass({

	render() {
		let event = this.props.event;
		let {events, step, min, culture, eventPropGetter, selected, eventTimeRangeFormat, eventComponent, startAccessor, endAccessor, titleAccessor } = this.props;

	    let EventComponent = eventComponent;
	    let lastLeftOffset = 0;

		let start = get(this.props.event, startAccessor)
		let end = get(this.props.event, endAccessor)
		let startSlot = positionFromDate(start, min, step);
		let endSlot = positionFromDate(end, min, step);

		lastLeftOffset = Math.max(0,
		overlaps(this.props.event, this.props.events.slice(0, this.props.idx), this.props, lastLeftOffset + 1))

		let style = this.props._slotStyle(startSlot, endSlot, lastLeftOffset)

		let title = get(event, titleAccessor)
		let label = localizer.format({ start, end }, eventTimeRangeFormat, culture);
		let _isSelected = isSelected(event, selected);

		if (eventPropGetter) {
			var { style: xStyle, className } = eventPropGetter(event, start, end, _isSelected);
		}

		const { isDragging, connectDragSource, text } = this.props;

		return connectDragSource(
	        <div
	          key={'evt_' + this.props.idx}
	          style={{...xStyle, ...style}}
	          title={label + ': ' + title }
	          onClick={this.props._select.bind(null, event)}
	          className={cn('rbc-event', className, {
	            'rbc-selected': _isSelected,
	            'rbc-event-overlaps': lastLeftOffset !== 0
	          })}
	        >
	          	<div className='rbc-event-label'>{label}</div>
	          	<div className='rbc-event-content'>
	            	{ EventComponent
	              		? <EventComponent event={event} title={title}/>
	              		: title
	            	}
	         	 </div>
	        </div>
	    )
	}
})

export default DragSource(ItemTypes.EVENT, eventSource, collect)(DaySlotEvent);