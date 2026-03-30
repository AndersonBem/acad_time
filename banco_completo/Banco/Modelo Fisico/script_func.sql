-- Retorna o papel do usuário no sistema (ALUNO, COORDENADOR, SUPERADMIN ou USUARIO).
CREATE FUNCTION fn_obter_papel_usuario(p_id_usuario integer)
RETURNS varchar
LANGUAGE plpgsql
AS
$$
DECLARE
    v_papel varchar;
BEGIN
    IF EXISTS (SELECT 1 FROM "Aluno" WHERE "idUsuario" = p_id_usuario) THEN
        v_papel := 'ALUNO';

    ELSIF EXISTS (SELECT 1 FROM "Coordenador" WHERE "idUsuario" = p_id_usuario) THEN
        v_papel := 'COORDENADOR';

    ELSIF EXISTS (SELECT 1 FROM "SuperAdmin" WHERE "idUsuario" = p_id_usuario) THEN
        v_papel := 'SUPERADMIN';

    ELSE
        v_papel := 'USUARIO';
    END IF;

    RETURN v_papel;
END;
$$;


-- Calcula o total de horas aprovadas de atividades complementares de um aluno.
CREATE FUNCTION fn_total_horas_aprovadas_aluno(p_id_aluno integer)
RETURNS numeric
LANGUAGE plpgsql
AS
$$
DECLARE
    total numeric;
BEGIN
    SELECT COALESCE(SUM(ac."cargaHorariaSolicitada"), 0)
    INTO total
    FROM "Submissao" s
    JOIN "AtividadeComplementar" ac
      ON ac."idAtividadeComplementar" = s."atividadeComplementa"
    WHERE s."idAluno" = p_id_aluno
      AND s."statusSubmissao" = 2;

    RETURN total;
END;
$$;


-- Retorna quantas horas ainda faltam para o aluno cumprir a carga mínima do curso.
CREATE FUNCTION fn_horas_restantes_aluno(
    p_id_aluno integer,
    p_id_curso integer
)
RETURNS numeric
LANGUAGE plpgsql
AS
$$
DECLARE
    v_total numeric;
    v_minimo integer;
BEGIN
    SELECT "cargaHorariaMinima"
    INTO v_minimo
    FROM "Curso"
    WHERE "idCurso" = p_id_curso;

    v_total := fn_total_horas_aprovadas_aluno(p_id_aluno);

    RETURN GREATEST(v_minimo - v_total, 0);
END;
$$;


-- Retorna quantas horas ainda podem ser aproveitadas para um tipo de atividade no curso.
CREATE FUNCTION fn_limite_disponivel_tipo(
    p_id_aluno integer,
    p_id_curso integer,
    p_id_tipo integer
)
RETURNS numeric
LANGUAGE plpgsql
AS
$$
DECLARE
    v_limite integer;
    v_usado numeric;
BEGIN
    SELECT "limiteHoras"
    INTO v_limite
    FROM "RegraAtividade"
    WHERE "Curso_idCurso" = p_id_curso
      AND "TipoAtividade_idTipoAtividade" = p_id_tipo;

    SELECT COALESCE(SUM(ac."cargaHorariaSolicitada"), 0)
    INTO v_usado
    FROM "Submissao" s
    JOIN "AtividadeComplementar" ac
      ON ac."idAtividadeComplementar" = s."atividadeComplementa"
    WHERE s."idAluno" = p_id_aluno
      AND s."statusSubmissao" = 2
      AND ac."tipoAtividade" = p_id_tipo;

    RETURN GREATEST(v_limite - v_usado, 0);
END;
$$;


-- Verifica se uma submissão pode ser aprovada com base no limite de horas do tipo de atividade.
CREATE FUNCTION fn_submissao_pode_ser_aprovada(p_id_submissao integer)
RETURNS boolean
LANGUAGE plpgsql
AS
$$
DECLARE
    v_tipo integer;
    v_curso integer;
    v_aluno integer;
    v_restante numeric;
    v_carga integer;
BEGIN
    SELECT
        ac."tipoAtividade",
        m."Curso_idCurso",
        s."idAluno",
        ac."cargaHorariaSolicitada"
    INTO v_tipo, v_curso, v_aluno, v_carga
    FROM "Submissao" s
    JOIN "AtividadeComplementar" ac
      ON ac."idAtividadeComplementar" = s."atividadeComplementa"
    JOIN "Matricula" m
      ON m."Aluno_idUsuario" = s."idAluno"
    WHERE s."idSubmissao" = p_id_submissao
    LIMIT 1;

    v_restante := fn_limite_disponivel_tipo(v_aluno, v_curso, v_tipo);

    IF v_carga > v_restante THEN
        RETURN false;
    END IF;

    RETURN true;
END;
$$;


-- Verifica se um usuário é coordenador ativo de um determinado curso.
CREATE FUNCTION fn_usuario_coordena_curso(
    p_id_usuario integer,
    p_id_curso integer
)
RETURNS boolean
LANGUAGE plpgsql
AS
$$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM "CoordenacaoCurso"
        WHERE "Coordenador_idUsuario" = p_id_usuario
          AND "Curso_idCurso" = p_id_curso
          AND "dataFim" IS NULL
    );
END;
$$;


SELECT fn_obter_papel_usuario(1);
SELECT fn_total_horas_aprovadas_aluno(3);
SELECT fn_horas_restantes_aluno(3, 2);
SELECT fn_limite_disponivel_tipo(3, 2, 3);
SELECT fn_submissao_pode_ser_aprovada(1);
SELECT fn_usuario_coordena_curso(13, 1);
