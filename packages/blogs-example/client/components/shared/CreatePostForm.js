import React, {Component} from 'react';
import Relay from 'react-relay';
import {browserHistory} from 'react-router';
import {CreatePost} from '../../mutations';

class CreatePostForm extends Component {
  state = {
    error: null,
  };

  createPost = e => {
    e.preventDefault();
    Relay.Store.commitUpdate(
      new CreatePost({
        user: this.props.user,
        title: e.target.title.value,
        text: e.target.text.value,
      }), {
        onSuccess: () => {
          browserHistory.push('/');
        },
        onFailure: transaction => this.setState({
          error: transaction.getError().source.errors[0].message
        }),
      }
    );
  };

  render() {
    const {error} = this.state;
    return (
      <form onSubmit={this.createPost}>
        <h3>New Post</h3>
        {error && <div className='error'>{error}</div>}
        <input name='title' type='text' placeholder='Title' autoFocus={true}/>
        <textarea name='text' placeholder='Text'/>
        <button type='submit'>Create Post</button>
      </form>
    );
  }
}

export default Relay.createContainer(
  CreatePostForm,
  {
    fragments: {
      user: () => Relay.QL`
        fragment on User {
          ${CreatePost.getFragment('user')}
        }
      `
    }
  }
);
