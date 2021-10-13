import { useState } from 'react';
import { GetStaticProps } from 'next';
import Link from 'next/link';
import Prismic from '@prismicio/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { FiCalendar, FiUser } from 'react-icons/fi';

import Header from '../components/Header';

import { getPrismicClient } from '../services/prismic';

import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState(postsPagination?.next_page);
  const [posts, setPosts] = useState<Post[]>(postsPagination?.results);

  const handlePagination = (): void => {
    fetch(nextPage)
      .then(res => res.json())
      .then(data => {
        setNextPage(data.next_page);

        const newPosts = data?.results?.map(post => {
          return {
            uid: post.uid,
            first_publication_date: post.first_publication_date,
            data: {
              title: post.data.title,
              subtitle: post.data.subtitle,
              author: post.data.author,
            },
          };
        });
        setPosts(prevPosts => {
          return [...prevPosts, ...newPosts];
        });
      })
      .catch(() => console.warn('Não foi possível carregar mais artigos.'));
  };

  return (
    <div className={styles.homeContainer}>
      <Header />
      <main className={commonStyles.container}>
        <div className={styles.posts}>
          {posts?.map(post => (
            <Link key={post.uid} href={`/post/${post.uid}`}>
              <a>
                <strong>{post.data.title}</strong>
                <p>{post.data.subtitle}</p>
                <div className={commonStyles.postInfo}>
                  <span>
                    <FiCalendar size={20} />
                    {format(
                      new Date(post.first_publication_date),
                      'dd MMM yyy',
                      {
                        locale: ptBR,
                      }
                    )}
                  </span>

                  <span>
                    <FiUser size={20} /> {post.data.author}
                  </span>
                </div>
              </a>
            </Link>
          ))}
        </div>

        {nextPage && (
          <button
            onClick={handlePagination}
            type="button"
            className={styles.pagination}
          >
            Carregar mais posts
          </button>
        )}
      </main>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['post.title', 'post.subtitle', 'post.author'],
      pageSize: 3,
    }
  );

  const posts = postsResponse?.results?.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: post.data.title,
        subtitle: post.data.subtitle,
        author: post.data.author,
      },
    } as Post;
  });

  // console.log(JSON.stringify(postsResponse, null, 2));

  return {
    props: {
      postsPagination: {
        next_page: postsResponse?.next_page ?? null,
        results: posts,
      },
    },
  };
};
