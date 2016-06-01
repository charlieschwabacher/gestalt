import React, {Component} from 'react';
import Relay from 'react-relay';
import {Link} from 'react-router';
import {User, Comment, CreateCommentForm} from '.';

export default Relay.createContainer(
  class Post extends Component {
    state = {
      commentFormOpen: false,
    };

    render() {
      const {post} = this.props;
      const {commentFormOpen} = this.state;

      return (
        <div className='col light-bg mb1'>
          <div className='main-bg p1'>
            <div className='row'>
              <Link to={`/posts/${post.id}`} className='flex m0 mr1'>
                {post.title}
              </Link>
              <User user={post.author}/>
            </div>
            <p>{post.text}</p>
          </div>
          <div className='mx1'>
            {
              post.comments.edges.map(({node: comment}, i) =>
                <Comment key={i} comment={comment}/>
              )
            }
            {
              commentFormOpen
              ?
                <div className='text-right mx-1 p1'>
                  <CreateCommentForm post={post}/>
                  <a onClick={() => this.setState({commentFormOpen: false})}>
                    Cancel
                  </a>
                </div>
              :
                <div className='text-right mx-1 p1'>
                  <a onClick={() => this.setState({commentFormOpen: true})}>
                    Comment
                  </a>
                </div>
            }
          </div>
        </div>
      );
    }
  },
  {
    fragments: {
      post: () => Relay.QL`
        fragment on Post {
          ${CreateCommentForm.getFragment('post')}
          id
          title
          text
          author {
            ${User.getFragment('user')}
          }
          comments {
            edges {
              node {
                ${Comment.getFragment('comment')}
              }
            }
          }
        }
      `
    }
  }
);
