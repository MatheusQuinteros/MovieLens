# MovieLens Explorer

Aplicação de consulta a uma base de filmes do MovieLens, feita em **Python puro**, com
**hash table, trie e Shell Sort implementados do zero** e uma interface web. Roda no navegador
(via Pyodide) ou com um servidor local.

![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python&logoColor=white)
![Biblioteca padrão](https://img.shields.io/badge/depend%C3%AAncias-nenhuma-success)
![HTML/CSS/JS](https://img.shields.io/badge/interface-HTML%20%2B%20CSS%20%2B%20JS-E34F26?logo=html5&logoColor=white)
![Pyodide](https://img.shields.io/badge/Pyodide-Python_no_navegador-4B8BBE)
![GitHub Pages](https://img.shields.io/badge/deploy-GitHub_Pages-222?logo=github)

### ▶ [Abrir o MovieLens Explorer online](https://matheusquinteros.github.io/Projeto-Final-CPD/)

Não precisa instalar nada. Na primeira visita, o navegador baixa o Python (Pyodide) e a amostra de
dados (~17 MB) e monta as estruturas, o que leva alguns segundos. A versão online usa só a
amostra; a base completa exige [rodar localmente](#como-executar).

## Demonstração

<!-- TODO: adicionar as capturas em docs/img/ -->
![Busca por prefixo "Toy" com resultados ordenados por nota](docs/img/busca-prefixo.png)

![Interseção das tags "sci-fi" e "action"](docs/img/combinar-tags.png)

## O que o projeto faz

- **Busca por prefixo do título** usando uma trie (ex.: `toy` → *Toy Story*, *Toy Story 2*…),
  com resultados ordenados pela nota média.
- **Perfil de usuário**: as 20 avaliações mais altas de um usuário, desempatadas pela nota global
  do filme.
- **Ranking por gênero** e **melhores filmes num intervalo de anos**, considerando só filmes com
  um número mínimo de avaliações.
- **Interseção de tags**: filmes marcados com duas tags ao mesmo tempo (ex.: `sci-fi` e `action`).
- **Dois conjuntos de dados**: uma amostra incluída no repositório (10 mil avaliações) e a base
  completa, que precisa ser baixada à parte. A interface mostra o tempo de carga e o de cada consulta.

## Destaques técnicos

- **Estruturas de dados implementadas do zero.**
  - [`hash_table.py`](Trabalho_final/hash_table.py): tabela hash com encadeamento separado. Chaves
    inteiras usam `key % M`; strings usam hash polinomial de base 33. São três tabelas: filmes,
    usuários e tags.
  - [`trie.py`](Trabalho_final/trie.py): trie R-ária (R = 256) indexando os títulos normalizados
    (minúsculas, só ASCII). A busca por prefixo desce até o nó do prefixo e coleta a subárvore.
  - [`funcoes.py`](Trabalho_final/funcoes.py): Shell Sort com a sequência de gaps de Ciura
    (estendida), que aceita uma função `key` como o `sorted` do Python, inclusive chaves compostas.
- **O mesmo Python no servidor e no navegador.** No GitHub Pages não há servidor: um Web Worker
  ([`pyodide-worker.js`](Trabalho_final/pyodide-worker.js)) carrega o
  [Pyodide](https://pyodide.org/) (CPython compilado para WebAssembly), copia para dentro dele os
  mesmos arquivos `.py` e os CSVs da amostra e chama `MovieSearchService`. Rodar num worker
  impede que a carga trave a página. A interface detecta sozinha se está falando com o `gui.py`
  (API HTTP) ou se deve usar o worker; os dois caminhos usam `MovieSearchService.consultar()`.
- **Separação entre consulta e apresentação.** [`search_service.py`](Trabalho_final/search_service.py)
  concentra as regras de consulta e devolve objetos `ResultadoFilme` (dataclass imutável), sem
  saber nada de HTTP ou HTML. [`gui.py`](Trabalho_final/gui.py) só traduz requisições JSON em
  chamadas ao serviço.
- **Sem dependências externas.** A versão original usava pandas; a carga foi reescrita com o
  módulo `csv`, lendo os arquivos linha a linha. O servidor usa `http.server` e a interface é
  HTML, CSS e JavaScript sem frameworks.
- **Carga em segundo plano com progresso.** Os dados são carregados numa thread; a função de
  carga recebe um callback de progresso, e a interface consulta `/api/status` para mostrar a barra.
  O estado compartilhado é protegido por `threading.Lock`. No navegador, o worker envia o progresso
  por mensagens.
- **Validação de entrada.** Quantidades fora de 1–100, anos invertidos ou campos vazios viram
  respostas HTTP 400 com mensagem legível, exibida na interface.

## Como executar

O jeito mais fácil é a [versão online](https://matheusquinteros.github.io/Projeto-Final-CPD/).

Para rodar localmente (necessário para a base completa), é preciso Python 3.10 ou mais recente
(o código usa a sintaxe `int | None`). Não há nada para instalar nem compilar.

```bash
git clone https://github.com/MatheusQuinteros/Projeto-Final-CPD.git
```

```bash
cd Projeto-Final-CPD/Trabalho_final
```

```bash
python3 gui.py
```

O navegador abre em `http://127.0.0.1:8765` e a amostra é carregada automaticamente (alguns
segundos). Opções:

```bash
python3 gui.py --port 9000 --no-browser
```

### Base completa (opcional)

A amostra em `dados-trabalho-pequeno/` já vem no repositório. Para usar a base completa, crie a
pasta `Trabalho_final/dados-trabalho-completo/` com `movies.csv`, `tags.csv` e `ratings.csv` no
mesmo formato da amostra (`movies.csv` tem uma coluna `year` separada do título) e escolha
**Base completa** na interface. Essa pasta está no `.gitignore` por causa do tamanho.

### Modo console

A interface de linha de comando original continua em `main.py`, mas ela **só lê a base completa**:

```bash
python3 main.py
```

Comandos: `prefixo <título>`, `user <id>`, `top <N> <gênero>`, `tags <tag1> <tag2>`,
`best <N> <ano1> <ano2>`, `exit`.

## Como usar

| Aba | Entrada | Resultado |
| --- | --- | --- |
| Buscar por título | início do título | todos os filmes com esse prefixo, por nota média |
| Perfil do usuário | ID do usuário | as 20 notas mais altas dele |
| Ranking por gênero | gênero e quantidade | melhores filmes do gênero (mín. 10 avaliações) |
| Combinar tags | duas tags | filmes que têm as duas |
| Melhores por período | quantidade, ano inicial e final | melhores do intervalo (mín. 10 avaliações na amostra, 1000 na base completa) |

O seletor **Conjunto de dados**, na barra lateral, alterna entre a amostra e a base completa.

## Estrutura

```
index.html             # redireciona para Trabalho_final/ (entrada do GitHub Pages)
Trabalho_final/
  hash_table.py        # tabela hash com encadeamento separado
  trie.py              # trie R-ária para busca por prefixo
  funcoes.py           # carga dos CSVs nas estruturas + Shell Sort (gaps de Ciura)
  classes.py           # entidades Movie, Usuario e Tag
  search_service.py    # consultas da interface web, independentes da apresentação
  gui.py               # servidor HTTP local e API JSON (/api/load, /api/status, /api/search)
  index.html           # interface (HTML, CSS e JS); escolhe entre servidor local e Pyodide
  pyodide-worker.js    # roda o Python no navegador quando não há servidor (GitHub Pages)
  main.py              # interface de console original (python3 main.py --gui abre a web)
  dados-trabalho-pequeno/
    movies.csv         # ~27 mil filmes
    tags.csv           # ~465 mil tags aplicadas
    miniratings.csv    # 10 mil avaliações (amostra)
```

## Contexto

Trabalho final da disciplina **Classificação e Pesquisa de Dados (INF01124)**, do Instituto de
Informática da UFRGS. <!-- TODO: confirmar código/semestre e se o trabalho foi em grupo -->
O enunciado pedia que as estruturas de indexação e ordenação fossem implementadas pelos alunos.

O que é de quem:

- **Trabalho original** (commit `917a94d`): hash table, trie, Shell Sort, entidades e a interface
  de console, escritos por mim. A carga dos dados usava pandas.
- **Feito com auxílio de IA (LLM)** depois da entrega (commit `44fdc2a`): a interface web
  (`gui.py`, `index.html`), a camada `search_service.py`, a troca do pandas pelo módulo `csv` e
  pequenos acréscimos na hash table (`__len__` e `valores()`). A versão para o navegador
  (Pyodide + Web Worker) também foi feita com IA. As estruturas de dados e o algoritmo
  de ordenação não foram alterados.
- **Dados**: [MovieLens](https://grouplens.org/datasets/movielens/), do GroupLens Research
  (Universidade de Minnesota), na versão pré-processada usada na disciplina. O uso segue os termos
  do GroupLens: fins não comerciais e citação da fonte.

> F. Maxwell Harper and Joseph A. Konstan. 2015. The MovieLens Datasets: History and Context.
> ACM Transactions on Interactive Intelligent Systems (TiiS) 5, 4: 19:1–19:19.
> https://doi.org/10.1145/2827872

## Licença

<!-- TODO: escolher uma licença (ex.: MIT) e adicionar o arquivo LICENSE. Os dados do MovieLens
     continuam sob os termos do GroupLens, independentemente da licença do código. -->
Ainda não definida.

## Autor

**Matheus Quinteros** · [GitHub](https://github.com/MatheusQuinteros)
