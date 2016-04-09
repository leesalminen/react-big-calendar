import React from 'react';
import {findDOMNode} from 'react-dom';
import cn from 'classnames';
import dates from './utils/dates';
import localizer from './localizer'

import ItemTypes from './utils/itemTypes';
import { DropTarget } from 'react-dnd';

const target = {
  canDrop(props, monitor) {
    // You can disallow drop based on props or item
    const item = monitor.getItem();

    console.log('can drop');

    return true;
  },

  hover(props, monitor, component) {
    // This is fired very often and lets you perform side effects
    // in response to the hover. You can't handle enter and leave
    // here—if you need them, put monitor.isOver() into collect() so you
    // can just use componentWillReceiveProps() to handle enter/leave.

    console.log('hover')

    // You can access the coordinates if you need them
    const clientOffset = monitor.getClientOffset();
    const componentRect = findDOMNode(component).getBoundingClientRect();

    // You can check whether we're over a nested drop target
    const isJustOverThisOne = monitor.isOver({ shallow: true });

    // You will receive hover() even for items for which canDrop() is false
    const canDrop = monitor.canDrop();
  },

  drop(props, monitor, component) {
  	console.log('drop');
    if (monitor.didDrop()) {
      // If you want, you can check whether some nested
      // target already handled drop
      return;
    }

    // Obtain the dragged item
    const item = monitor.getItem();
    console.log('dropped');

    // You can also do nothing and return a drop result,
    // which will be available as monitor.getDropResult()
    // in the drag source's endDrag() method
    return { moved: true };
  }
};

function collect(connect, monitor) {
  return {
    // Call this function inside render()
    // to let React DnD handle the drag events:
    connectDropTarget: connect.dropTarget(),
    // You can ask the monitor about the current drag state:
    isOver: monitor.isOver(),
    isOverCurrent: monitor.isOver({ shallow: true }),
    canDrop: monitor.canDrop(),
    itemType: monitor.getItemType()
  };
}

let DaySlotContainer = React.createClass({
	
	render() {
		const { isOver, canDrop, connectDropTarget } = this.props;

		return connectDropTarget(
			<div className='rbc-time-slot' style={{backgroundColor: (isOver && canDrop) ? 'green' : null}} />
		);
	}
})

export default DropTarget(ItemTypes.EVENT, target, collect)(DaySlotContainer);