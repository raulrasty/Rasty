-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.album_favorite_songs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL,
  song_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT album_favorite_songs_pkey PRIMARY KEY (id),
  CONSTRAINT album_favorites_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id),
  CONSTRAINT album_favorites_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id),
  CONSTRAINT album_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.album_ratings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  album_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating numeric NOT NULL CHECK (rating >= 0.5 AND rating <= 5::numeric),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT album_ratings_pkey PRIMARY KEY (id),
  CONSTRAINT album_ratings_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id),
  CONSTRAINT album_ratings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.albums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  musicbrainz_id text UNIQUE,
  title text NOT NULL,
  artist text NOT NULL,
  release_date date,
  cover_url text,
  release_year integer,
  CONSTRAINT albums_pkey PRIMARY KEY (id)
);
CREATE TABLE public.favorite_albums (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  album_id uuid NOT NULL,
  position integer NOT NULL CHECK ("position" >= 1 AND "position" <= 5),
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT favorite_albums_pkey PRIMARY KEY (id),
  CONSTRAINT favorite_albums_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT favorite_albums_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id)
);
CREATE TABLE public.follows (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  following_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT follows_pkey PRIMARY KEY (id),
  CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.users(id),
  CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.users(id)
);
CREATE TABLE public.listen_favorite_songs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  listen_id uuid NOT NULL,
  song_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT listen_favorite_songs_pkey PRIMARY KEY (id),
  CONSTRAINT listen_favorites_listen_id_fkey FOREIGN KEY (listen_id) REFERENCES public.listens(id),
  CONSTRAINT listen_favorites_song_id_fkey FOREIGN KEY (song_id) REFERENCES public.songs(id),
  CONSTRAINT listen_favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.listens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  album_id uuid,
  rating numeric CHECK (rating >= 0::numeric AND rating <= 5::numeric),
  liked boolean DEFAULT false,
  review text,
  listen_date timestamp without time zone DEFAULT now(),
  CONSTRAINT listens_pkey PRIMARY KEY (id),
  CONSTRAINT listens_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id)
);
CREATE TABLE public.p_activo (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  num numeric,
  CONSTRAINT p_activo_pkey PRIMARY KEY (id)
);
CREATE TABLE public.songs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  album_id uuid,
  position integer,
  title text NOT NULL,
  length integer,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT songs_pkey PRIMARY KEY (id),
  CONSTRAINT songs_album_id_fkey FOREIGN KEY (album_id) REFERENCES public.albums(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  username text NOT NULL UNIQUE,
  avatar_url text,
  bio text,
  location text,
  birth_date date,
  role text DEFAULT 'user'::text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);