'use strict';

const React = require('react');
const ReactDOM = require('react/lib/ReactDOM');
const Bootstrap = require('react-bootstrap');

let Wrapper = React.createClass({
    render: function() {
        return (<div className="wrapper">{this.props.children}</div>);
    }
});

let MyComponent = React.createClass({
    render: function() {
        return (<Wrapper>hola mundo</Wrapper>);
    }
});

ReactDOM.render((<MyComponent/>), document.getElementById('reactMount'));
