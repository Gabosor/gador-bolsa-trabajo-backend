--
-- PostgreSQL database dump
--

-- Dumped from database version 16.9
-- Dumped by pg_dump version 16.9

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: audit_logs_accion_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.audit_logs_accion_enum AS ENUM (
    'CREATE',
    'UPDATE',
    'DELETE',
    'LOGIN',
    'CHANGE_STATUS'
);


--
-- Name: catalogos_tipo_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.catalogos_tipo_enum AS ENUM (
    'RUBRO',
    'PROFESION',
    'TIPO_CONTRATO',
    'MODALIDAD',
    'DEPARTAMENTO',
    'MUNICIPIO'
);


--
-- Name: empresas_estado_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.empresas_estado_enum AS ENUM (
    'PENDIENTE_VALIDACION',
    'APROBADA',
    'RECHAZADA',
    'SUSPENDIDA'
);


--
-- Name: ofertas_estado_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.ofertas_estado_enum AS ENUM (
    'BORRADOR',
    'EN_REVISION_GADOR',
    'PUBLICADA',
    'EN_PROCESO_SELECCION',
    'CERRADA',
    'ANULADA'
);


--
-- Name: postulaciones_estado_enum; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.postulaciones_estado_enum AS ENUM (
    'POSTULADO',
    'VISTO',
    'PRESELECCIONADO',
    'ENTREVISTA',
    'FINALISTA',
    'CONTRATADO',
    'RECHAZADO'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id integer,
    accion public.audit_logs_accion_enum NOT NULL,
    tabla_afectada character varying(60) NOT NULL,
    registro_id integer,
    datos_anteriores jsonb,
    datos_nuevos jsonb,
    ip character varying(64),
    fecha timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: catalogos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.catalogos (
    id integer NOT NULL,
    tipo public.catalogos_tipo_enum NOT NULL,
    nombre character varying(120) NOT NULL,
    activo boolean DEFAULT true NOT NULL,
    parent_id integer
);


--
-- Name: catalogos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.catalogos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: catalogos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.catalogos_id_seq OWNED BY public.catalogos.id;


--
-- Name: configuraciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.configuraciones (
    clave character varying(60) NOT NULL,
    valor character varying(255) NOT NULL
);


--
-- Name: empresas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.empresas (
    id integer NOT NULL,
    nit character varying(20) NOT NULL,
    razon_social character varying(200) NOT NULL,
    representante_legal character varying(150) NOT NULL,
    ci_representante character varying(20) NOT NULL,
    celular character varying(20) NOT NULL,
    email_corporativo character varying(150) NOT NULL,
    direccion character varying(255) NOT NULL,
    logo_key character varying,
    descripcion text NOT NULL,
    documento_nit_key character varying,
    documento_legal_key character varying,
    estado public.empresas_estado_enum DEFAULT 'PENDIENTE_VALIDACION'::public.empresas_estado_enum NOT NULL,
    motivo_rechazo text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL,
    rubro_id integer NOT NULL
);


--
-- Name: empresas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.empresas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: empresas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.empresas_id_seq OWNED BY public.empresas.id;


--
-- Name: experiencias; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.experiencias (
    id integer NOT NULL,
    empresa character varying(150) NOT NULL,
    cargo character varying(120) NOT NULL,
    anios integer NOT NULL,
    descripcion text NOT NULL,
    profile_id integer NOT NULL
);


--
-- Name: experiencias_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.experiencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: experiencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.experiencias_id_seq OWNED BY public.experiencias.id;


--
-- Name: favoritos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.favoritos (
    id integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    profile_id integer NOT NULL,
    oferta_id integer NOT NULL
);


--
-- Name: favoritos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.favoritos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: favoritos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.favoritos_id_seq OWNED BY public.favoritos.id;


--
-- Name: formaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.formaciones (
    id integer NOT NULL,
    institucion character varying(150) NOT NULL,
    anio_titulacion integer NOT NULL,
    nro_titulo_nacional character varying(50) NOT NULL,
    profile_id integer NOT NULL,
    profesion_id integer NOT NULL
);


--
-- Name: formaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.formaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: formaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.formaciones_id_seq OWNED BY public.formaciones.id;


--
-- Name: habilidades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.habilidades (
    id integer NOT NULL,
    nombre character varying(80) NOT NULL,
    activo boolean DEFAULT true NOT NULL
);


--
-- Name: habilidades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.habilidades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: habilidades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.habilidades_id_seq OWNED BY public.habilidades.id;


--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notificaciones (
    id integer NOT NULL,
    titulo character varying(150) NOT NULL,
    mensaje text NOT NULL,
    leida boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: notificaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notificaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notificaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notificaciones_id_seq OWNED BY public.notificaciones.id;


--
-- Name: oferta_habilidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oferta_habilidad (
    id integer NOT NULL,
    obligatoria boolean DEFAULT true NOT NULL,
    nivel_minimo integer DEFAULT 1 NOT NULL,
    oferta_id integer NOT NULL,
    habilidad_id integer NOT NULL
);


--
-- Name: oferta_habilidad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.oferta_habilidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: oferta_habilidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.oferta_habilidad_id_seq OWNED BY public.oferta_habilidad.id;


--
-- Name: oferta_profesion; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.oferta_profesion (
    oferta_id integer NOT NULL,
    profesion_id integer NOT NULL
);


--
-- Name: ofertas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ofertas (
    id integer NOT NULL,
    titulo character varying(150) NOT NULL,
    descripcion text NOT NULL,
    requisitos_obligatorios text NOT NULL,
    requisitos_deseables text,
    anios_experiencia integer DEFAULT 0 NOT NULL,
    salario_min integer,
    salario_max integer,
    salario_a_tratar boolean DEFAULT false NOT NULL,
    beneficios text,
    fecha_cierre date NOT NULL,
    numero_plazas integer DEFAULT 1 NOT NULL,
    estado public.ofertas_estado_enum DEFAULT 'BORRADOR'::public.ofertas_estado_enum NOT NULL,
    motivo_rechazo text,
    total_vistas integer DEFAULT 0 NOT NULL,
    aviso_cierre_enviado boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    empresa_id integer NOT NULL,
    tipo_contrato_id integer NOT NULL,
    modalidad_id integer NOT NULL,
    municipio_id integer NOT NULL
);


--
-- Name: ofertas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ofertas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ofertas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ofertas_id_seq OWNED BY public.ofertas.id;


--
-- Name: postulaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.postulaciones (
    id integer NOT NULL,
    estado public.postulaciones_estado_enum DEFAULT 'POSTULADO'::public.postulaciones_estado_enum NOT NULL,
    porcentaje_match integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    oferta_id integer NOT NULL,
    postulante_id integer NOT NULL
);


--
-- Name: postulaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.postulaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: postulaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.postulaciones_id_seq OWNED BY public.postulaciones.id;


--
-- Name: postulante_habilidad; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.postulante_habilidad (
    id integer NOT NULL,
    nivel integer NOT NULL,
    profile_id integer NOT NULL,
    habilidad_id integer NOT NULL
);


--
-- Name: postulante_habilidad_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.postulante_habilidad_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: postulante_habilidad_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.postulante_habilidad_id_seq OWNED BY public.postulante_habilidad.id;


--
-- Name: postulante_profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.postulante_profiles (
    id integer NOT NULL,
    foto_key character varying,
    direccion character varying(255),
    fecha_nacimiento date,
    cv_key character varying,
    idiomas jsonb DEFAULT '[]'::jsonb NOT NULL,
    porcentaje_completitud integer DEFAULT 0 NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: postulante_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.postulante_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: postulante_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.postulante_profiles_id_seq OWNED BY public.postulante_profiles.id;


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id integer NOT NULL,
    endpoint text NOT NULL,
    p256dh character varying NOT NULL,
    auth character varying NOT NULL,
    user_id integer NOT NULL
);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id integer NOT NULL,
    nombre character varying(30) NOT NULL
);


--
-- Name: roles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.roles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: roles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.roles_id_seq OWNED BY public.roles.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id integer NOT NULL,
    nombre_completo character varying(150) NOT NULL,
    ci character varying(20),
    email character varying(150) NOT NULL,
    celular character varying(20) NOT NULL,
    password character varying NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    failed_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    phone_verified boolean DEFAULT false NOT NULL,
    otp_hash character varying,
    otp_expires_at timestamp with time zone,
    reset_token_hash character varying,
    reset_expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    role_id integer NOT NULL
);


--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: catalogos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogos ALTER COLUMN id SET DEFAULT nextval('public.catalogos_id_seq'::regclass);


--
-- Name: empresas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas ALTER COLUMN id SET DEFAULT nextval('public.empresas_id_seq'::regclass);


--
-- Name: experiencias id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiencias ALTER COLUMN id SET DEFAULT nextval('public.experiencias_id_seq'::regclass);


--
-- Name: favoritos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos ALTER COLUMN id SET DEFAULT nextval('public.favoritos_id_seq'::regclass);


--
-- Name: formaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formaciones ALTER COLUMN id SET DEFAULT nextval('public.formaciones_id_seq'::regclass);


--
-- Name: habilidades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habilidades ALTER COLUMN id SET DEFAULT nextval('public.habilidades_id_seq'::regclass);


--
-- Name: notificaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones ALTER COLUMN id SET DEFAULT nextval('public.notificaciones_id_seq'::regclass);


--
-- Name: oferta_habilidad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oferta_habilidad ALTER COLUMN id SET DEFAULT nextval('public.oferta_habilidad_id_seq'::regclass);


--
-- Name: ofertas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas ALTER COLUMN id SET DEFAULT nextval('public.ofertas_id_seq'::regclass);


--
-- Name: postulaciones id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones ALTER COLUMN id SET DEFAULT nextval('public.postulaciones_id_seq'::regclass);


--
-- Name: postulante_habilidad id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulante_habilidad ALTER COLUMN id SET DEFAULT nextval('public.postulante_habilidad_id_seq'::regclass);


--
-- Name: postulante_profiles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulante_profiles ALTER COLUMN id SET DEFAULT nextval('public.postulante_profiles_id_seq'::regclass);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Name: roles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles ALTER COLUMN id SET DEFAULT nextval('public.roles_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: oferta_profesion PK_0486edcb0ad7718596084ab0bdf; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oferta_profesion
    ADD CONSTRAINT "PK_0486edcb0ad7718596084ab0bdf" PRIMARY KEY (oferta_id, profesion_id);


--
-- Name: formaciones PK_1aa445b3581d5d21c51a42f91a7; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formaciones
    ADD CONSTRAINT "PK_1aa445b3581d5d21c51a42f91a7" PRIMARY KEY (id);


--
-- Name: audit_logs PK_1bb179d048bbc581caa3b013439; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT "PK_1bb179d048bbc581caa3b013439" PRIMARY KEY (id);


--
-- Name: catalogos PK_1d78e1f35ded834637978e7cbf2; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogos
    ADD CONSTRAINT "PK_1d78e1f35ded834637978e7cbf2" PRIMARY KEY (id);


--
-- Name: favoritos PK_2a6a4d0119130451dc0b644590a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT "PK_2a6a4d0119130451dc0b644590a" PRIMARY KEY (id);


--
-- Name: habilidades PK_2f85f81d38ab1e59754157813d4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habilidades
    ADD CONSTRAINT "PK_2f85f81d38ab1e59754157813d4" PRIMARY KEY (id);


--
-- Name: configuraciones PK_343e7df00b49bc3cc71d54c98d1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.configuraciones
    ADD CONSTRAINT "PK_343e7df00b49bc3cc71d54c98d1" PRIMARY KEY (clave);


--
-- Name: ofertas PK_5ae09ce42a5883ce4500c7d05e3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas
    ADD CONSTRAINT "PK_5ae09ce42a5883ce4500c7d05e3" PRIMARY KEY (id);


--
-- Name: postulante_profiles PK_5d096f32e4b3b4e8a3cc7abec21; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulante_profiles
    ADD CONSTRAINT "PK_5d096f32e4b3b4e8a3cc7abec21" PRIMARY KEY (id);


--
-- Name: push_subscriptions PK_757fc8f00c34f66832668dc2e53; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT "PK_757fc8f00c34f66832668dc2e53" PRIMARY KEY (id);


--
-- Name: experiencias PK_8299f6bb73e2f3fe5590b134a7c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiencias
    ADD CONSTRAINT "PK_8299f6bb73e2f3fe5590b134a7c" PRIMARY KEY (id);


--
-- Name: postulaciones PK_9ba0a5bde35fc08e51d5a015a9a; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT "PK_9ba0a5bde35fc08e51d5a015a9a" PRIMARY KEY (id);


--
-- Name: users PK_a3ffb1c0c8416b9fc6f907b7433; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY (id);


--
-- Name: notificaciones PK_a9d32a419ff58b53a38b5ef85d4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT "PK_a9d32a419ff58b53a38b5ef85d4" PRIMARY KEY (id);


--
-- Name: roles PK_c1433d71a4838793a49dcad46ab; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "PK_c1433d71a4838793a49dcad46ab" PRIMARY KEY (id);


--
-- Name: postulante_habilidad PK_c61646106bbb54c978467099ce0; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulante_habilidad
    ADD CONSTRAINT "PK_c61646106bbb54c978467099ce0" PRIMARY KEY (id);


--
-- Name: empresas PK_ce7b122b37c6499bfd6520873e1; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "PK_ce7b122b37c6499bfd6520873e1" PRIMARY KEY (id);


--
-- Name: oferta_habilidad PK_e8877701b031920db7cf8c0afe4; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oferta_habilidad
    ADD CONSTRAINT "PK_e8877701b031920db7cf8c0afe4" PRIMARY KEY (id);


--
-- Name: empresas REL_7cbf50e3a99959587a52532a3c; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "REL_7cbf50e3a99959587a52532a3c" UNIQUE (user_id);


--
-- Name: postulante_profiles REL_817aab4ef17274b30ee2221117; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulante_profiles
    ADD CONSTRAINT "REL_817aab4ef17274b30ee2221117" UNIQUE (user_id);


--
-- Name: push_subscriptions UQ_0008bdfd174e533a3f98bf9af16; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT "UQ_0008bdfd174e533a3f98bf9af16" UNIQUE (endpoint);


--
-- Name: empresas UQ_3815a71fa4034941beaf0051189; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "UQ_3815a71fa4034941beaf0051189" UNIQUE (nit);


--
-- Name: oferta_habilidad UQ_840081c7530740767089938e67d; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oferta_habilidad
    ADD CONSTRAINT "UQ_840081c7530740767089938e67d" UNIQUE (oferta_id, habilidad_id);


--
-- Name: habilidades UQ_89831c9fc1d969af53d4a831c98; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.habilidades
    ADD CONSTRAINT "UQ_89831c9fc1d969af53d4a831c98" UNIQUE (nombre);


--
-- Name: users UQ_97672ac88f789774dd47f7c8be3; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE (email);


--
-- Name: roles UQ_a5be7aa67e759e347b1c6464e10; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT "UQ_a5be7aa67e759e347b1c6464e10" UNIQUE (nombre);


--
-- Name: postulante_habilidad UQ_aad9f3c458fcd6032d72dd8f757; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulante_habilidad
    ADD CONSTRAINT "UQ_aad9f3c458fcd6032d72dd8f757" UNIQUE (profile_id, habilidad_id);


--
-- Name: favoritos UQ_b886a4940f21d8e28cbacd0702f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT "UQ_b886a4940f21d8e28cbacd0702f" UNIQUE (profile_id, oferta_id);


--
-- Name: users UQ_eff3cf686729ac337fe991de64f; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "UQ_eff3cf686729ac337fe991de64f" UNIQUE (ci);


--
-- Name: postulaciones UQ_f6cbb8b639fe9fdeddefbd6e3be; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT "UQ_f6cbb8b639fe9fdeddefbd6e3be" UNIQUE (oferta_id, postulante_id);


--
-- Name: IDX_412f6159659f17371835afb55d; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_412f6159659f17371835afb55d" ON public.oferta_profesion USING btree (oferta_id);


--
-- Name: IDX_a5d70837e2113b0a678d0f4d0f; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX "IDX_a5d70837e2113b0a678d0f4d0f" ON public.oferta_profesion USING btree (profesion_id);


--
-- Name: ofertas FK_02a9301f7709ab2a834d2ef2e50; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas
    ADD CONSTRAINT "FK_02a9301f7709ab2a834d2ef2e50" FOREIGN KEY (modalidad_id) REFERENCES public.catalogos(id);


--
-- Name: notificaciones FK_0a5f87551149ecc486ee8477c5f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notificaciones
    ADD CONSTRAINT "FK_0a5f87551149ecc486ee8477c5f" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: postulante_habilidad FK_1b1a35e10e3a796dfca394b0ff6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulante_habilidad
    ADD CONSTRAINT "FK_1b1a35e10e3a796dfca394b0ff6" FOREIGN KEY (profile_id) REFERENCES public.postulante_profiles(id) ON DELETE CASCADE;


--
-- Name: catalogos FK_2a74ba1b1b38fc663d0ea3a9565; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.catalogos
    ADD CONSTRAINT "FK_2a74ba1b1b38fc663d0ea3a9565" FOREIGN KEY (parent_id) REFERENCES public.catalogos(id);


--
-- Name: favoritos FK_39a4487afb2613ac1ce84e385e1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT "FK_39a4487afb2613ac1ce84e385e1" FOREIGN KEY (oferta_id) REFERENCES public.ofertas(id) ON DELETE CASCADE;


--
-- Name: ofertas FK_3e3c112a192c6ed06efa32ba593; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas
    ADD CONSTRAINT "FK_3e3c112a192c6ed06efa32ba593" FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


--
-- Name: oferta_profesion FK_412f6159659f17371835afb55d7; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oferta_profesion
    ADD CONSTRAINT "FK_412f6159659f17371835afb55d7" FOREIGN KEY (oferta_id) REFERENCES public.ofertas(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: oferta_habilidad FK_42358f3a43181d7a2ecedbe2de3; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oferta_habilidad
    ADD CONSTRAINT "FK_42358f3a43181d7a2ecedbe2de3" FOREIGN KEY (oferta_id) REFERENCES public.ofertas(id) ON DELETE CASCADE;


--
-- Name: favoritos FK_5695203b7ed302fd25f1f4753b6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.favoritos
    ADD CONSTRAINT "FK_5695203b7ed302fd25f1f4753b6" FOREIGN KEY (profile_id) REFERENCES public.postulante_profiles(id) ON DELETE CASCADE;


--
-- Name: push_subscriptions FK_6771f119f1c06d2ccf38f238664; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT "FK_6771f119f1c06d2ccf38f238664" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: empresas FK_6d70d2be95c2d23a1a69fe7b643; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "FK_6d70d2be95c2d23a1a69fe7b643" FOREIGN KEY (rubro_id) REFERENCES public.catalogos(id);


--
-- Name: ofertas FK_6d78b5dcd5c1d019cc597f0342c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas
    ADD CONSTRAINT "FK_6d78b5dcd5c1d019cc597f0342c" FOREIGN KEY (tipo_contrato_id) REFERENCES public.catalogos(id);


--
-- Name: ofertas FK_723b166306d599a40c43c62c188; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ofertas
    ADD CONSTRAINT "FK_723b166306d599a40c43c62c188" FOREIGN KEY (municipio_id) REFERENCES public.catalogos(id);


--
-- Name: experiencias FK_761d8ce428d39b90851cbe32921; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.experiencias
    ADD CONSTRAINT "FK_761d8ce428d39b90851cbe32921" FOREIGN KEY (profile_id) REFERENCES public.postulante_profiles(id) ON DELETE CASCADE;


--
-- Name: postulante_habilidad FK_7c960afc3dd3912dc62707e3b8c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulante_habilidad
    ADD CONSTRAINT "FK_7c960afc3dd3912dc62707e3b8c" FOREIGN KEY (habilidad_id) REFERENCES public.habilidades(id);


--
-- Name: empresas FK_7cbf50e3a99959587a52532a3cf; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT "FK_7cbf50e3a99959587a52532a3cf" FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: postulante_profiles FK_817aab4ef17274b30ee2221117c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulante_profiles
    ADD CONSTRAINT "FK_817aab4ef17274b30ee2221117c" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users FK_a2cecd1a3531c0b041e29ba46e1; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "FK_a2cecd1a3531c0b041e29ba46e1" FOREIGN KEY (role_id) REFERENCES public.roles(id);


--
-- Name: oferta_profesion FK_a5d70837e2113b0a678d0f4d0f6; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oferta_profesion
    ADD CONSTRAINT "FK_a5d70837e2113b0a678d0f4d0f6" FOREIGN KEY (profesion_id) REFERENCES public.catalogos(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: formaciones FK_a90e68ee678570d5259d068be9c; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formaciones
    ADD CONSTRAINT "FK_a90e68ee678570d5259d068be9c" FOREIGN KEY (profile_id) REFERENCES public.postulante_profiles(id) ON DELETE CASCADE;


--
-- Name: postulaciones FK_ab6f470bc52a23cdd49e535eb9f; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT "FK_ab6f470bc52a23cdd49e535eb9f" FOREIGN KEY (postulante_id) REFERENCES public.postulante_profiles(id);


--
-- Name: formaciones FK_cf00ef343cda8b9f646dbde3fae; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.formaciones
    ADD CONSTRAINT "FK_cf00ef343cda8b9f646dbde3fae" FOREIGN KEY (profesion_id) REFERENCES public.catalogos(id);


--
-- Name: postulaciones FK_daa720af7330aa5803048361675; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT "FK_daa720af7330aa5803048361675" FOREIGN KEY (oferta_id) REFERENCES public.ofertas(id);


--
-- Name: oferta_habilidad FK_f9848b38058a2bbb3fe4da34c22; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.oferta_habilidad
    ADD CONSTRAINT "FK_f9848b38058a2bbb3fe4da34c22" FOREIGN KEY (habilidad_id) REFERENCES public.habilidades(id);


--
-- PostgreSQL database dump complete
--

