import React, {Component} from 'react';
import Relay from 'react-relay';
import {SignIn} from '../../mutations';

export default Relay.createContainer(
  class SignInForm extends Component {
    state = {
      loading: false,
      error: null,
    };

    signIn = e => {
      e.preventDefault();
      if (this.state.loading) {
        return;
      }

      this.setState({loading: true});
      Relay.Store.commitUpdate(
        new SignIn({
          session: this.props.session,
          email: e.target.email.value,
          password: e.target.password.value,
        }), {
          onFailure: transaction => this.setState({
            loading: false,
            error: transaction.getError().source.errors[0].message
          }),
          onSuccess: response => {
            this.setState({loading: false});
          },
        }
      );
    }

    render() {
      const {loading, error} = this.state;
      return (
        <form
          onSubmit={this.signIn}
          className='col align-stretch'
        >
          {error && <div className='error'>{error}</div>}
          <input
            name='email'
            type='email'
            placeholder='Email'
            disabled={loading}
          />
          <input
            name='password'
            type='password'
            placeholder='Password'
            disabled={loading}
          />
          <input
            type='submit'
            value='Sign In'
            disabled={loading}
          />
        </form>
      );
    }
  },
  {
    fragments: {
      session: () => Relay.QL`
        fragment on Session {
          ${SignIn.getFragment('session')}
        }
      `
    }
  }
);
