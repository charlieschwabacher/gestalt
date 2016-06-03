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
            <div className='row mb1'>
              <Link to={`/posts/${post.id}`} className='flex m0 mr1'>
                {post.title}
              </Link>
              <User user={post.author}/>
            </div>
            <div>{post.text}</div>
          </div>
          <div className='mx1'>
            {
              post.comments.edges.map(({node: comment}, i) =>
                <Comment key={i} comment={comment}/>
              )
            }
            <div className='text-right mx-1 p1'>
              <a
                onClick={
                  () => this.setState({commentFormOpen: !commentFormOpen})
                }
              >
                {commentFormOpen ? 'Cancel' : 'Comment'}
              </a>
              {commentFormOpen && <CreateCommentForm post={post}/>}
            </div>
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
