-- Aprova uma submissão válida, registrando o coordenador responsável e a observação.
CREATE PROCEDURE sp_aprovar_submissao(
    p_id_submissao integer,
    p_id_coordenador integer,
    p_obs text
)
LANGUAGE plpgsql
AS
$$
DECLARE
    v_curso integer;
BEGIN
    SELECT m."Curso_idCurso"
    INTO v_curso
    FROM "Submissao" s
    JOIN "Matricula" m
      ON m."Aluno_idUsuario" = s."idAluno"
    WHERE s."idSubmissao" = p_id_submissao;

    IF NOT fn_usuario_coordena_curso(p_id_coordenador, v_curso) THEN
        RAISE EXCEPTION 'Coordenador não pertence ao curso';
    END IF;

    IF NOT fn_submissao_pode_ser_aprovada(p_id_submissao) THEN
        RAISE EXCEPTION 'Submissao invalida';
    END IF;

    UPDATE "Submissao"
    SET "statusSubmissao" = 2,
        "observacaoCoordenador" = p_obs,
        "idCoordenador" = p_id_coordenador
    WHERE "idSubmissao" = p_id_submissao;
END;
$$;


-- Reprova uma submissão, registrando o coordenador responsável e a observação.
CREATE PROCEDURE sp_reprovar_submissao(
    p_id_submissao integer,
    p_id_coordenador integer,
    p_obs text
)
LANGUAGE plpgsql
AS
$$
BEGIN
    UPDATE "Submissao"
    SET "statusSubmissao" = 3,
        "observacaoCoordenador" = p_obs,
        "idCoordenador" = p_id_coordenador
    WHERE "idSubmissao" = p_id_submissao;
END;
$$;


-- Cadastra um usuário e, em seguida, cria seu vínculo como aluno.
CREATE PROCEDURE sp_cadastrar_aluno_com_usuario(
    p_nome varchar,
    p_email varchar,
    p_senha text,
    p_matricula varchar
)
LANGUAGE plpgsql
AS
$$
DECLARE v_id integer;
BEGIN
    INSERT INTO "Usuario"(nome,email,"senhaHash")
    VALUES(p_nome,p_email,p_senha)
    RETURNING "idUsuario" INTO v_id;

    INSERT INTO "Aluno"
    VALUES(v_id,0,p_matricula);
END;
$$;


-- Cadastra um usuário e, em seguida, cria seu vínculo como coordenador.
CREATE PROCEDURE sp_cadastrar_coordenador_com_usuario(
    p_nome varchar,
    p_email varchar,
    p_senha text,
    p_telefone varchar DEFAULT NULL
)
LANGUAGE plpgsql
AS
$$
DECLARE 
    v_id integer;
BEGIN
    -- Cria o usuário
    INSERT INTO "Usuario"(nome, email, "senhaHash")
    VALUES(p_nome, p_email, p_senha)
    RETURNING "idUsuario" INTO v_id;

    -- Cria o coordenador
    INSERT INTO "Coordenador"
    VALUES(v_id, true);

    -- Se telefone foi informado, cadastra
    IF p_telefone IS NOT NULL THEN
        INSERT INTO "Telefone"(numero, "idUsuario")
        VALUES(p_telefone, v_id);
    END IF;
END;
$$;


-- Matricula um aluno em um curso, impedindo matrícula duplicada.
CREATE PROCEDURE sp_matricular_aluno_em_curso(
    p_aluno integer,
    p_curso integer,
    p_status integer
)
LANGUAGE plpgsql
AS
$$
BEGIN
    IF EXISTS (
        SELECT 1 FROM "Matricula"
        WHERE "Aluno_idUsuario" = p_aluno
          AND "Curso_idCurso" = p_curso
    ) THEN
        RAISE EXCEPTION 'Aluno já matriculado';
    END IF;

    INSERT INTO "Matricula"
    VALUES(p_curso,p_aluno,CURRENT_DATE,p_status);
END;
$$;


-- Vincula um coordenador a um curso com data de início da coordenação.
CREATE PROCEDURE sp_vincular_coordenador_curso(
    p_coord integer,
    p_curso integer
)
LANGUAGE plpgsql
AS
$$
BEGIN
    INSERT INTO "CoordenacaoCurso"
    VALUES(p_curso,p_coord,CURRENT_DATE,NULL);
END;
$$;


-- Registra uma nova submissão de atividade complementar enviada por um aluno.
CREATE PROCEDURE sp_registrar_submissao(
    p_aluno integer,
    p_atividade integer,
    p_certificado integer
)
LANGUAGE plpgsql
AS
$$
BEGIN
    INSERT INTO "Submissao"
    ("dataEnvio","idAluno","atividadeComplementa","statusSubmissao",certificado)
    VALUES(
        CURRENT_DATE,
        p_aluno,
        p_atividade,
        1,
        p_certificado
    );
END;
$$;