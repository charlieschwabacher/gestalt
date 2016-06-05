import React, {Component} from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import {User} from '.';

export default Relay.createContainer(
  class Post extends Component {
    state = {
      commentFormOpen: false,
    };

    render() {
      const {post} = this.props;
      const {commentFormOpen} = this.state;

      return (
        <div>
          <div className='row'>
            <Link to={`/posts/${post.id}`} className='flex'>
              <strong>{post.title}</strong>
            </Link>
            <User user={post.author}/>
          </div>
          <p>{post.text}</p>
          <hr/>
        </div>
      );
    }
  },
  {
    fragments: {
      post: () => Relay.QL`
        fragment on Post {
          id
          title
          text
          author {
            ${User.getFragment('user')}
          }
        }
      `
    }
  }
);
