import React, { PropTypes } from 'react';
import BigCalendar from 'react-big-calendar';
import events from '../events';
import _ from 'lodash';
import moment from 'moment';

let Basic = React.createClass({
  getInitialState() {
  	return {
  		events: events,
  	}
  },

  dropEvent(item) {
  	var newEvent  = item.event;
  	var newEvents = _.cloneDeep(this.state.events);
  	var event     = _.find(this.state.events, {id: item.event.id});

  	let totalMin = (event.end - event.start) / 1000 / 60;

  	newEvent.start = item.new_start || newEvent.start;
  	newEvent.end   = new Date(moment(newEvent.start).add(totalMin, 'minutes').format());

  	_.remove(newEvents, {id: item.event.id});
  	newEvents.push(newEvent)

  	this.setState({
  		events: newEvents,
  	})

  },

  render(){
    return (
      <BigCalendar
        events={this.state.events}
        defaultDate={new Date(2015, 3, 13)}
        onDropEvent={this.dropEvent}
      />
    )
  }
})

export default Basic;
