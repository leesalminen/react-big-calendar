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

import DaySlotEvent from './DaySlotEvent';
import DaySlotContainer from './DaySlotContainer';

function snapToSlot(date, step){
  var roundTo = 1000 * 60 * step;
  return new Date(Math.floor(date.getTime() / roundTo) * roundTo)
}

function positionFromDate(date, min, step){
  return dates.diff(min, dates.merge(min, date), 'minutes')
}

let DaySlot = React.createClass({

  propTypes: {
    events: React.PropTypes.array.isRequired,
    step: React.PropTypes.number.isRequired,
    min: React.PropTypes.instanceOf(Date).isRequired,
    max: React.PropTypes.instanceOf(Date).isRequired,

    allDayAccessor: accessor.isRequired,
    startAccessor: accessor.isRequired,
    endAccessor: accessor.isRequired,

    selectable: React.PropTypes.bool,
    eventOffset: React.PropTypes.number,

    onSelecting: React.PropTypes.func,
    onSelectSlot: React.PropTypes.func.isRequired,
    onSelectEvent: React.PropTypes.func.isRequired
  },

  getInitialState() {
    return { selecting: false };
  },


  componentDidMount() {
    this.props.selectable
      && this._selectable()
  },

  componentWillUnmount() {
    this._teardownSelectable();
  },

  componentWillReceiveProps(nextProps) {
    if (nextProps.selectable && !this.props.selectable)
      this._selectable();
    if (!nextProps.selectable && this.props.selectable)
      this._teardownSelectable();
  },

  render() {
    let {
        min, max, step, start, end
      , selectRangeFormat, culture, ...props } = this.props;

    let totalMin = dates.diff(min, max, 'minutes')
    let numSlots = Math.ceil(totalMin / step)
    let children = [];

    for (var i = 0; i < numSlots; i++) {
      children.push(Math.random())
    }

    this._totalMin = totalMin;

    let { selecting, startSlot, endSlot } = this.state
       , style = this._slotStyle(startSlot, endSlot, 0)

    let selectDates = {
      start: this.state.startDate,
      end: this.state.endDate
    };

    return (
      <div {...props} className={cn('rbc-day-slot', props.className)}>
        { 
          children.map((child, idx) => {
            return (
              <DaySlotContainer key={child} />
            )
          }) 
        }
        { this.renderEvents(numSlots, totalMin) }
        {
          selecting &&
            <div className='rbc-slot-selection' style={style}>
              <span>
              { localizer.format(selectDates, selectRangeFormat, culture) }
              </span>
            </div>
        }
      </div>
    );
  },

  renderEvents(numSlots, totalMin) {
    let {
        events, step, min, culture, eventPropGetter
      , selected, eventTimeRangeFormat, eventComponent
      , startAccessor, endAccessor, titleAccessor } = this.props;

    let EventComponent = eventComponent
      , lastLeftOffset = 0;

    events.sort((a, b) => +get(a, startAccessor) - +get(b, startAccessor))

    return events.map((event, idx) => {
      return (
        <DaySlotEvent {...this.props} event={event} idx={idx} key={Math.random()} _slotStyle={this._slotStyle} _select={this._select} />
      )
    })
  },

  _slotStyle(startSlot, endSlot, leftOffset){

    endSlot = Math.max(endSlot, startSlot + this.props.step) //must be at least one `step` high

    let eventOffset = this.props.eventOffset || 10
      , isRtl = this.props.rtl;

    let top = ((startSlot / this._totalMin) * 100);
    let bottom = ((endSlot / this._totalMin) * 100);
    let per = leftOffset === 0 ? 0 : leftOffset * eventOffset;
    let rightDiff = (eventOffset / (leftOffset + 1));

    return {
      top: top + '%',
      height: bottom - top + '%',
      [isRtl ? 'right' : 'left']: per + '%',
      width: (leftOffset === 0 ? (100 - eventOffset) : (100 - per) - rightDiff) + '%'
    }
  },


  _select(event){
    clearTimeout(this._clickTimer);
    notify(this.props.onSelectEvent, event)
  },

  _selectable(){
    let node = findDOMNode(this);
    let selector = this._selector = new Selection(()=> findDOMNode(this))

    let maybeSelect = (box) => {
      let onSelecting = this.props.onSelecting
      let current = this.state || {};
      let state = selectionState(box);
      let { startDate: start, endDate: end } = state;

      if (onSelecting) {
        if (
          (dates.eq(current.startDate, start, 'minutes') &&
          dates.eq(current.endDate, end, 'minutes')) ||
          onSelecting({ start, end }) === false
        )
         return
      }

      this.setState(state)
    }

    let selectionState = ({ x, y }) => {
      let { step, min, max } = this.props;
      let { top, bottom } = getBoundsForNode(node)

      let mins = this._totalMin;

      let range = Math.abs(top - bottom)

      let current = (y - top) / range;

      current = snapToSlot(minToDate(mins * current, min), step)

      if (!this.state.selecting)
        this._initialDateSlot = current

      let initial = this._initialDateSlot;

      if (dates.eq(initial, current, 'minutes'))
        current = dates.add(current, step, 'minutes')

      let start = dates.max(min, dates.min(initial, current))
      let end = dates.min(max, dates.max(initial, current))

      return {
        selecting: true,
        startDate: start,
        endDate: end,
        startSlot: positionFromDate(start, min, step),
        endSlot: positionFromDate(end, min, step)
      }
    }

    selector.on('selecting', maybeSelect)
    selector.on('selectStart', maybeSelect)

    selector
      .on('click', ({ x, y }) => {
        this._clickTimer = setTimeout(()=> {
          this._selectSlot(selectionState({ x, y }))
        })

        this.setState({ selecting: false })
      })

    selector
      .on('select', () => {
        if (this.state.selecting) {
          this._selectSlot(this.state)
          this.setState({ selecting: false })
        }
      })
  },

  _teardownSelectable() {
    if (!this._selector) return
    this._selector.teardown();
    this._selector = null;
  },

  _selectSlot({ startDate, endDate, endSlot, startSlot }) {
    let current = startDate
      , slots = [];

    while (dates.lte(current, endDate)) {
      slots.push(current)
      current = dates.add(current, this.props.step, 'minutes')
    }

    notify(this.props.onSelectSlot, {
      slots,
      start: startDate,
      end: endDate
    })
  },
});


function minToDate(min, date){
  var dt = new Date(date)
    , totalMins = dates.diff(dates.startOf(date, 'day'), date, 'minutes');

  dt = dates.hours(dt, 0);
  dt = dates.minutes(dt, totalMins + min);
  dt = dates.seconds(dt, 0)
  return dates.milliseconds(dt, 0)
}

export default DaySlot;
