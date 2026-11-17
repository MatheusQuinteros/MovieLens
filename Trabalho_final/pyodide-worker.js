// Executa o código Python do projeto no navegador (Pyodide), fora da thread da
// interface. Usado quando a página é servida como site estático (GitHub Pages),
// sem o servidor de gui.py. Só a amostra de dados está disponível neste modo.

importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js");

const ARQUIVOS_PYTHON = [
  "classes.py", "hash_table.py", "trie.py", "funcoes.py", "search_service.py",
];
const ARQUIVOS_DADOS = ["movies.csv", "tags.csv", "miniratings.csv"];
const RAIZ = "/home/pyodide";

let consultar = null;

function progresso(mensagem, percentual) {
  postMessage({ tipo: "progresso", mensagem, percentual });
}

async function baixar(caminho) {
  const resposta = await fetch(caminho);
  if (!resposta.ok) throw new Error(`Não foi possível baixar ${caminho}.`);
  return new Uint8Array(await resposta.arrayBuffer());
}

async function carregar() {
  const inicio = performance.now();
  progresso("Carregando o Python no navegador...", 2);
  const pyodide = await loadPyodide();
  const fs = pyodide.FS;

  progresso("Baixando o código e a amostra de dados...", 8);
  fs.mkdirTree(`${RAIZ}/dados-trabalho-pequeno`);
  const downloads = [
    ...ARQUIVOS_PYTHON.map(async (nome) => fs.writeFile(`${RAIZ}/${nome}`, await baixar(nome))),
    ...ARQUIVOS_DADOS.map(async (nome) =>
      fs.writeFile(`${RAIZ}/dados-trabalho-pequeno/${nome}`, await baixar(`dados-trabalho-pequeno/${nome}`))),
  ];
  await Promise.all(downloads);

  pyodide.runPython(`
import json, sys
from dataclasses import asdict
if "${RAIZ}" not in sys.path:
    sys.path.insert(0, "${RAIZ}")
from search_service import MovieSearchService

servico = MovieSearchService()

def consultar(tipo, campos_json):
    try:
        resultados = servico.consultar(tipo, json.loads(campos_json))
    except ValueError as erro:
        return json.dumps({"erro": str(erro)}, ensure_ascii=False)
    return json.dumps({"resultados": [asdict(r) for r in resultados]}, ensure_ascii=False)
`);
  const stats = pyodide.globals.get("servico").carregar("amostra", progresso).toJs({
    dict_converter: Object.fromEntries,
  });
  consultar = pyodide.globals.get("consultar");
  return { stats, duracao: (performance.now() - inicio) / 1000 };
}

onmessage = async ({ data }) => {
  try {
    if (data.tipo === "carregar") {
      postMessage({ tipo: "pronto", ...(await carregar()) });
    } else if (data.tipo === "buscar") {
      postMessage({ tipo: "resultado", id: data.id, ...JSON.parse(consultar(data.consulta, JSON.stringify(data.campos))) });
    }
  } catch (erro) {
    postMessage({ tipo: "erro", id: data.id, erro: String(erro.message || erro) });
  }
};
