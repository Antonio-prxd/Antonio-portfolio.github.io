/**
 * Portfolio Data Analyst — script.js
 * Tab navigation + modal avec galerie (images + code)
 */

// ─── DONNÉES PROJETS ───────────────────────────────────────────────────────────
const PROJECTS = {
  ecommerce: {
    tag: 'SQL · DAX · Power BI',
    title: 'Analyse des ventes Toys & Models',
    desc: '',

    // Sections enrichies
    contexte: 'Exploitation d\'une base de données MySQL internationale couvrant 3 années de ventes de jouets et modèles réduits. Le projet consiste à transformer des données brutes transactionnelles en une suite décisionnelle interactive composée de 5 rapports thématiques (Ventes, Logistique, Finances, Performance commerciale et Vue d\'ensemble).',
    objectif: '<ul><li>Explorer et comprendre la base de données existante de l’entreprise (employés, produits, commandes, etc.).</li><li>Analyser les données afin d’identifier les indicateurs clés de performance.</li><li>Concevoir un tableau de bord dynamique et actualisable quotidiennement pour aider la direction à suivre l’activité et faciliter la prise de décision.</li></ul>',
    outils: ['MySQL 8.0', 'Power BI Desktop', 'DAX (KPIs complexes)', 'Power Query (ETL)', 'Modélisation en Étoile'],
    methodo: '<ul><li>Nettoyage de la base MySQL.</li><li>Création de vues SQL métiers pour structurer les faits et dimensions.</li><li>Modélisation en schéma en étoile sur Power BI.</li><li>Création de mesures DAX avancées (Calcul de marges %, Top/Flop analytique etc.).</li><li>Design de 5 pages de dashboard avec filtres croisés et UX optimisée.</li></ul>',
    apports: 'Visibilité 360° sur l\'activité : Identification des 10 meilleurs produits (Ferrari 360 Spider en tête), analyse géographique mondiale des ventes, réduction du risque financier grâce au rapport "Dettes clients" et aide à la décision opérationnelle pour la gestion des stocks.',
    competences: [
      'SQL — Création de vues agrégées et jointures complexes',
      'Modélisation — Mise en place d\'un schéma en étoile robuste',
      'DAX — Écriture de mesures complexes (Time Intelligence, Top N, Ratios)',
      'Power BI — Conception d\'un dashboard multi-pages interactif',
      'Data Storytelling — Transformation de chiffres bruts en insights actionnables',
    ],

    chips: ['MySQL', 'DAX', 'Power BI', 'Power Query'],
    github: 'https://github.com/votre-pseudo/toys-and-models',
    media: {
      images: [
        'images/toys_db_1.png',
        'images/toys_db_2.png',
        'images/toys_db_3.png',
        'images/toys_db_4.png',
        'images/toys_db_5.png'
      ],
      codes: [
        {
          label: 'Vue analytique — fact_sales',
          lang: 'sql',
          src: `-- Création d'une vue analytique centralisant les données de ventes
-- Cette vue servira de table de faits pour l'analyse commerciale

CREATE VIEW fact_sales AS (
SELECT

    -- Identifiants principaux
    orderdetails.orderNumber,          -- Identifiant de la commande
    orders.customerNumber,             -- Identifiant du client
    orderdetails.productCode,          -- Identifiant du produit

    -- Informations sur la commande
    orderdetails.quantityOrdered,      -- Quantité commandée
    products.quantityInStock,          -- Stock disponible du produit
    products.buyPrice,                 -- Prix d'achat du produit
    orderdetails.priceEach,            -- Prix de vente unitaire

    -- Calcul du chiffre d'affaires par ligne de commande
    orderdetails.quantityOrdered * orderdetails.priceEach AS CA_par_ligne,

    -- Informations temporelles de la commande
    orders.orderDate,                  -- Date de commande
    orders.requiredDate,               -- Date demandée par le client
    orders.status,                     -- Statut de la commande (Shipped, Cancelled, etc.)
    orders.shippedDate,                -- Date d'expédition

    -- Calcul du délai de préparation de la commande
    DATEDIFF(orders.shippedDate, orders.orderDate) AS Delai_de_prepa,

    -- Informations commerciales
    employees.employeeNumber,          -- Commercial responsable du client
    employees.officeCode,              -- Bureau du commercial

    -- Total des paiements effectués par le client
    paiements_client.total_paye_client,

    -- Calcul du chiffre d'affaires total généré par client
    -- Les commandes annulées sont exclues du calcul
    SUM(
        CASE 
            WHEN orders.status <> 'Cancelled' 
            THEN orderdetails.quantityOrdered * orderdetails.priceEach
            ELSE 0
        END
    ) OVER (PARTITION BY orders.customerNumber) AS CA_total_client,

    -- Calcul du solde client :
    -- différence entre le montant payé et le chiffre d'affaires généré
    paiements_client.total_paye_client 
    - SUM(
        CASE 
            WHEN orders.status <> 'Cancelled' 
            THEN orderdetails.quantityOrdered * orderdetails.priceEach
            ELSE 0
        END
    ) OVER (PARTITION BY orders.customerNumber) AS solde_client

FROM orderdetails

-- Jointure avec la table des commandes
JOIN orders 
    ON orderdetails.orderNumber = orders.orderNumber

-- Jointure avec les informations clients
JOIN customers 
    ON customers.customerNumber = orders.customerNumber

-- Jointure avec les commerciaux responsables
JOIN employees 
    ON customers.salesRepEmployeeNumber = employees.employeeNumber

-- Jointure avec les informations produits
JOIN products 
    ON products.productCode = orderdetails.productCode

-- Jointure avec les bureaux commerciaux
JOIN offices 
    ON offices.officeCode = employees.officeCode


-- Sous-requête permettant de calculer le total payé par chaque client
LEFT JOIN (
    SELECT
        payments.customerNumber,
        SUM(payments.amount) AS total_paye_client
    FROM payments
    GROUP BY payments.customerNumber
) paiements_client
    ON paiements_client.customerNumber = orders.customerNumber
);`,
        },
        {
          label: 'Modélisation dimensionnelle (Star Schema)',
          lang: 'sql',
          src: `-- ============================================================
-- DIMENSION 1 : Paiements
-- Création d'une vue dimensionnelle à partir de la table payments
-- Cette dimension permet d'analyser les règlements effectués par les clients
-- ============================================================
CREATE VIEW DIM_payment AS (
    SELECT *
    FROM payments
);


-- ============================================================
-- DIMENSION 2 : Clients
-- Création d'une dimension client contenant les informations
-- géographiques, commerciales et financières utiles à l'analyse
-- ============================================================
CREATE VIEW Dim_Customer AS (
    SELECT 
        customerNumber,             -- Identifiant unique du client
        customerName,               -- Nom du client / de l'entreprise
        city,                       -- Ville du client
        state,                      -- État / région
        postalCode,                 -- Code postal
        country,                    -- Pays
        salesRepEmployeeNumber,     -- Commercial rattaché au client
        creditLimit                 -- Limite de crédit autorisée
    FROM customers
);


-- ============================================================
-- DIMENSION 3 : Produits
-- Création d'une dimension produit pour enrichir les analyses
-- de ventes avec les caractéristiques des articles
-- ============================================================
CREATE VIEW Dim_Product AS (
    SELECT 
        productCode,                -- Identifiant unique du produit
        productName,                -- Nom du produit
        productLine,                -- Gamme / catégorie de produit
        productScale,               -- Échelle / format du produit
        productVendor,              -- Fournisseur
        quantityInStock,            -- Quantité actuellement en stock
        buyPrice                    -- Prix d'achat du produit
    FROM products
);


-- ============================================================
-- DIMENSION 4 : Bureaux / agences
-- Création d'une dimension géographique et organisationnelle
-- pour analyser les performances par bureau commercial
-- ============================================================
CREATE VIEW Dim_offices AS (
    SELECT 
        officeCode,                 -- Identifiant du bureau
        city,                       -- Ville
        state,                      -- État / région
        country,                    -- Pays
        postalCode,                 -- Code postal
        territory                   -- Territoire commercial couvert
    FROM offices
);


-- ============================================================
-- DIMENSION 5 : Employés
-- Création d'une dimension collaborateurs permettant d'étudier
-- les performances commerciales par employé ou manager
-- ============================================================
CREATE VIEW Dim_employees AS (
    SELECT 
        employeeNumber,             -- Identifiant unique de l'employé
        lastName,                   -- Nom de famille
        firstName,                  -- Prénom
        officeCode,                 -- Bureau de rattachement
        reportsTo,                  -- Manager / supérieur hiérarchique
        jobTitle                    -- Fonction occupée
    FROM employees
);


-- ============================================================
-- PARAMÉTRAGE
-- Augmente la profondeur maximale de récursion autorisée
-- afin de générer une série de dates sur plusieurs années
-- ============================================================
SET @@cte_max_recursion_depth = 3000;


-- ============================================================
-- DIMENSION 6 : Dates
-- Création d'une table calendrier à partir d'une CTE récursive
-- Cette dimension temps est essentielle pour les analyses
-- temporelles : année, mois, trimestre, semaine, jour, etc.
-- ============================================================
CREATE TABLE DIM_DATES AS
WITH RECURSIVE date_series AS (

    -- Point de départ de la série de dates
    SELECT DATE('2019-01-01') AS full_date

    UNION ALL

    -- Ajout d'un jour à chaque itération jusqu'à la date de fin
    SELECT DATE_ADD(full_date, INTERVAL 1 DAY)
    FROM date_series
    WHERE full_date < DATE('2025-12-31')
)

SELECT
    full_date AS order_date,            -- Date complète
    YEAR(full_date) AS year,            -- Année
    MONTH(full_date) AS month,          -- Numéro du mois
    QUARTER(full_date) AS quarter,      -- Trimestre
    DATE_FORMAT(full_date, '%M') AS month_name,   -- Nom du mois
    WEEK(full_date, 1) AS week_number,  -- Numéro de semaine (norme ISO-like)
    DAY(full_date) AS day_of_month,     -- Jour du mois
    DAYNAME(full_date) AS day_name      -- Nom du jour
FROM date_series;`,
        },
        {
          label: 'Mesures DAX — KPIs Décisionnels',
          lang: 'dax',
          src: `// ===========================================================
// EXTRAIT DES MESURES DAX DU PROJET
// Les mesures ci-dessous représentent une partie des indicateurs
// développés pour le pilotage commercial, logistique et financier.
// ===========================================================



// ===========================================================
// 1. PERFORMANCE COMMERCIALE
// ===========================================================

CA par Bureau = 
CALCULATE(
    [CA Total],
    ALLEXCEPT(dim_offices, dim_offices[officeCode])
)
// Mesure du chiffre d'affaires par bureau commercial.



// ===========================================================
// 2. LOGISTIQUE
// ===========================================================

Consommation 3 derniers mois = 
CALCULATE(
    SUM(fact_sales[quantityOrdered]),
    DATESINPERIOD(
        fact_sales[orderDate],
        MAX(fact_sales[orderDate]),
        -3,
        MONTH
    )
)
// Suivi de la consommation récente pour anticiper les besoins en stock.

Nb de jours pour le traitement = 
AVERAGEX(
    fact_sales,
    DATEDIFF(
        fact_sales[orderDate],
        fact_sales[shippedDate],
        DAY
    )
)
// Calcul du délai moyen entre la commande et l'expédition.



// ===========================================================
// 3. CHIFFRE D’AFFAIRES
// ===========================================================

Panier_moyen_global = 
CALCULATE(
    DIVIDE(
        SUM(fact_sales[CA_par_ligne]),
        DISTINCTCOUNT(fact_sales[orderNumber])
    ),
    ALL(dim_customer),
    ALL(fact_sales[customerNumber])
)
// Calcul du panier moyen global sur l'ensemble des clients.

CA Mois N-1 + 10% = 
CALCULATE(
    [Total non agrégé(total CA_par_Ligne)],
    SAMEPERIODLASTYEAR(DIM_Date[Date])
) * 1.10
// Projection d'un objectif de chiffre d'affaires à partir de N-1.`,
        },
      ],
    },
  },
  movies: {
    tag: 'Python · Machine Learning',
    title: 'Système de recommandation de films',
    desc: 'Un cinéma de la Creuse souhaite se digitaliser en développant un site web intégrant un outil d’analyse et de recommandation de films.',

    // Sections enrichies
    contexte: 'À partir de données issues d’IMDb et de TMDB, l’objectif est d’analyser les tendances du cinéma et les pratiques locales afin d’aider le directeur à adapter sa programmation aux films les plus populaires et aux préférences du public de la Creuse.',
    objectif: 'Comment la data et le machine learning peuvent-ils aider le cinéma Le Colbert à programmer les films les plus adaptés à son public local et à augmenter son affluence, malgré un manque initial de données ?',
    outils: ['Python', 'Scikit-learn', 'NLTK', 'Pandas & NumPy', 'Matplotlib / Seaborn', 'Streamlit', 'Trello', 'Google Colab', 'VS Code'],
    methodo: '<ul><li>Réalisation d’une étude de marché sur la consommation de cinéma dans la Creuse.</li><li>Collecte, nettoyage et filtrage des données issues d’IMDb et de TMDb, en cohérence avec les résultats de l’étude.</li><li>Développement d’un système de recommandation de films avec scikit-learn.</li><li>Création d’une application Streamlit pour visualiser les KPI et utiliser le moteur de recommandation.</li></ul>',
    apports: 'Une programmation optimisée basée sur la donnée réelle, permettant de maximiser le taux de remplissage tout en respectant l’identité culturelle du cinéma de la Creuse.',
    competences: [
      'Analyse de marché — Étude de la consommation cinématographique locale',
      'Data Engineering — Collecte et nettoyage de données (IMDb & TMDb)',
      'Machine Learning — Implémentation d’un moteur de recommandation (scikit-learn)',
      'Application d’aide à la décision — Développement d’une interface Streamlit permettant d’exploiter le moteur de recommandation',
    ],

    chips: ['Python', 'Scikit-learn', 'NLTK', 'Pandas', 'NumPy', 'Streamlit', 'Trello', 'Google Colab', 'VS Code'],
    github: 'https://github.com/votre-pseudo/movie-recommendation',
    demo: 'https://cinevision.streamlit.app/',
    media: {
      codes: [
        {
          label: 'Préparation des données IMDb',
          lang: 'python',
          src: `# ===============================================================
# PROJET : Analyse et préparation des données IMDb
# Objectif : Construire une base de films exploitable pour
# un système de recommandation et une aide à la programmation
# ===============================================================


# ===============================================================
# 1. Import des bibliothèques
# ===============================================================
import pandas as pd
import datetime
import datetime as dt


# ===============================================================
# 2. Chargement du dataset principal (title.basics)
# Contient les informations principales sur les films :
# - identifiant
# - type de contenu
# - titre
# - année de sortie
# - durée
# - genres
# ===============================================================
df_titles = pd.read_csv(
    "https://datasets.imdbws.com/title.basics.tsv.gz",
    sep="\\t"
)


# ===============================================================
# 3. Nettoyage et filtrage des données
# - On conserve uniquement les films
# - Suppression des années manquantes
# ===============================================================
df_titles = df_titles[df_titles["titleType"] == "movie"]
df_titles = df_titles.dropna(subset=["startYear"])


# ===============================================================
# 4. Transformation des genres
# Les genres sont séparés en liste pour faciliter les analyses
# ===============================================================
df_titles["genres_list"] = df_titles["genres"].str.split(",")


# ===============================================================
# 5. Chargement des titres par région (title.akas)
# Permet d'obtenir les titres localisés selon les pays
# ===============================================================
df_regions = pd.read_csv(
    "https://datasets.imdbws.com/title.akas.tsv.gz",
    sep="\\t",
    usecols=["titleId", "region", "title"]
)


# ===============================================================
# 6. Filtrage sur la région France
# Objectif : garder uniquement les titres disponibles pour le
# marché français
# ===============================================================
df_regions_fr = df_regions[df_regions["region"] == "FR"]


# ===============================================================
# 7. Fusion des datasets
# Merge entre les informations des films et les titres FR
# ===============================================================
df_movies_fr = pd.merge(
    df_titles,
    df_regions_fr,
    left_on="tconst",
    right_on="titleId",
    how="inner"
)


# ===============================================================
# 8. Aperçu du dataset final
# ===============================================================
df_movies_fr.head()


# ===============================================================
# Dataset final prêt pour :
# - Analyse exploratoire
# - Création de KPI
# - Développement du moteur de recommandation
# ===============================================================`,
        },
        {
          label: 'Moteur de recommandation pondéré',
          lang: 'python',
          src: `def nom_de_film():
    """
    Recommande des films similaires à partir d'un film saisi par l'utilisateur
    en pondérant plusieurs critères : box office, genre, acteurs, réalisateurs et note.
    """
    try:
        poids = {
            "trés faible": 0.2,
            "faible": 0.5,
            "moyen": 1,
            "fort": 2,
            "trés fort": 5
        }

        titre = str(input("Veuillez rentrer un nom de film : ")).lower()

        Box_office = str(input("Choisissez l'importance du paramètre box office (revenus générés) : trés faible, faible, moyen, fort, trés fort : "))
        Genre = str(input("Choisissez l'importance du paramètre genre : trés faible, faible, moyen, fort, trés fort : "))
        Acteurs_Actrices = str(input("Choisissez l'importance du paramètre acteurs et actrices : trés faible, faible, moyen, fort, trés fort : "))
        Réalisateurs = str(input("Choisissez l'importance du paramètre Réalisateurs : trés faible, faible, moyen, fort, trés fort : "))
        Note = str(input("Choisissez l'importance du paramètre note du film : trés faible, faible, moyen, fort, trés fort : "))

        # Chargement des données
        df = pd.read_csv("https://raw.githubusercontent.com/Antonio-prxd/Projet_2_IMDB/master/FinalMerge.csv")
        df1 = df.copy()

        # Préparation des colonnes
        df["Titre_fr"] = df["Titre_fr"].str.lower()
        df_genresdummies = df["Genres"].str.get_dummies(sep=",")
        df_concat = pd.concat([df_genresdummies, df], axis=1)

        df_concat["Annee_de_sortie"] = pd.to_datetime(
            df_concat["Annee_de_sortie"], errors="coerce"
        ).dt.year

        df_concat["Synopsis"] = df_concat["Synopsis"].fillna("").astype(str)
        df_concat["Acteur_actrice"] = df_concat["Acteur_actrice"].fillna("").astype(str)
        df_concat["Realisateur"] = df_concat["Realisateur"].fillna("").astype(str)

        # Définition des variables du modèle
        col_genres = [
            "Action", "Adventure", "Animation", "Biography", "Comedy", "Crime",
            "Documentary", "Drama", "Family", "Fantasy", "History", "Mystery",
            "Romance", "Thriller", "War", "Sci-Fi"
        ]
        col_num = ["Annee_de_sortie", "Duree(min)", "Note_moyenne", "Nombre_de_votes", "Budget"]
        col_note = ["Note_moyenne"]
        col_box = ["Box_office"]
        col_cat = ["Langue_originale"]

        # Préprocessing
        preprocessor = ColumnTransformer(transformers=[
            ("num", StandardScaler(), col_num),
            ("box", make_pipeline(
                StandardScaler(),
                FunctionTransformer(lambda X: X * poids[Box_office])
            ), col_box),
            ("note", make_pipeline(
                StandardScaler(),
                FunctionTransformer(lambda X: X * poids[Note])
            ), col_note),
            ("cat", OneHotEncoder(handle_unknown="ignore"), col_cat),
            ("genres", make_pipeline(
                "passthrough",
                FunctionTransformer(lambda X: X * poids[Genre])
            ), col_genres),
            ("synopsis", TfidfVectorizer(max_features=5000, stop_words="english"), "Synopsis"),
            ("acteurs", make_pipeline(
                CountVectorizer(token_pattern=r"[^,]+"),
                FunctionTransformer(lambda X: X * poids[Acteurs_Actrices])
            ), "Acteur_actrice"),
            ("real", make_pipeline(
                CountVectorizer(token_pattern=r"[^,]+"),
                FunctionTransformer(lambda X: X * poids[Réalisateurs])
            ), "Realisateur")
        ])

        pipeline = Pipeline(steps=[
            ("preprocessing", preprocessor)
        ])

        X = pipeline.fit_transform(df_concat)

        # Vérification de l'existence du film
        idx = df.index[df["Titre_fr"] == titre]
        if len(idx) == 0:
            return "Film introuvable dans la base de données"

        # Entraînement et recommandations
        model = NearestNeighbors(n_neighbors=6, metric="cosine")
        model.fit(X)

        distance, indice = model.kneighbors(X[idx].reshape(1, -1))

        return df1["Titre_fr"].iloc[indice[0][1:]].tolist()

    except ValueError:
        return "Pas dans la base de donnée ou erreur d'orthographe"`,
        },
      ],
    },
  },
  rh: {
    tag: 'Power BI',
    title: 'Dashboard RH interactif',
    desc: 'Tableau de bord Power BI pour piloter les indicateurs RH clés : turnover, absentéisme et coûts de formation.',
    objectif: 'Centraliser les KPIs RH dispersés dans plusieurs fichiers Excel et offrir une vision temps réel aux managers.',
    methodo: 'Modélisation en étoile, formules DAX avancées, connexion directe aux sources Excel et synchronisation mensuelle automatisée.',
    resultats: 'Réduction de 60 % du temps de reporting mensuel. Adoption par 4 managers dès le premier mois.',
    chips: ['Power BI', 'DAX', 'Excel', 'Power Query'],
    github: 'https://github.com/votre-pseudo/dashboard-rh',
    media: {
      // images: ['images/dashboard_rh.png'],
      code: {
        lang: 'dax',
        src: `// Taux de turnover (DAX)
Turnover Rate =
DIVIDE(
    [Nb Départs sur Période],
    AVERAGE([Effectif Début]) + AVERAGE([Effectif Fin]) / 2,
    0
) * 100

// Absentéisme
Taux Absentéisme =
DIVIDE([Jours Absents], [Jours Travaillables Théoriques], 0) * 100`,
      },
    },
  },
  churn: {
    tag: 'Python · ML',
    title: 'Prédiction du churn client',
    desc: 'Modèle de machine learning pour prédire le désabonnement client avec une précision de 87 %.',
    objectif: 'Anticiper les clients à risque de résiliation afin de déclencher des actions de rétention ciblées.',
    methodo: 'Feature engineering, comparaison modèles (LR, RF, XGBoost), optimisation GridSearchCV, interprétabilité SHAP.',
    resultats: 'Précision 87 %, F1-score 0,84. Réduction estimée du churn de 12 % si déployé en production.',
    chips: ['Python', 'Scikit-learn', 'XGBoost', 'SHAP', 'Seaborn'],
    github: 'https://github.com/votre-pseudo/churn-prediction',
    media: {
      // images: ['images/churn_confusion.png', 'images/churn_shap.png'],
      code: {
        lang: 'python',
        src: `from xgboost import XGBClassifier
from sklearn.model_selection import GridSearchCV, train_test_split
from sklearn.metrics import classification_report
import shap

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=.2, stratify=y, random_state=42
)

params = {'max_depth': [3, 5], 'n_estimators': [100, 300],
          'learning_rate': [.05, .1]}
model = GridSearchCV(XGBClassifier(use_label_encoder=False),
                     params, cv=5, scoring='f1')
model.fit(X_train, y_train)

print(classification_report(y_test, model.predict(X_test)))

# Interprétabilité
explainer = shap.Explainer(model.best_estimator_)
shap.summary_plot(explainer(X_test), X_test)`,
      },
    },
  },
  finance: {
    tag: 'Tableau',
    title: 'Visualisation données financières',
    desc: 'Dashboard Tableau pour le suivi des KPIs financiers d\'une PME : CA, marges, budget vs réalisé, comparatifs N-1.',
    objectif: 'Offrir à la direction financière une vue consolidée et interactive des performances par entité et période.',
    methodo: 'Connexion Tableau à bases SQL, calculs de table comparatifs N-1, filtres dynamiques et storytelling de données.',
    resultats: 'Dashboard adopté par le comité de direction. Détection d\'un écart budgétaire de 8 % non visible auparavant.',
    chips: ['Tableau', 'SQL', 'Excel', 'Calculated Fields'],
    github: 'https://github.com/votre-pseudo/dashboard-finance',
    media: {
      // images: ['images/finance_dashboard.png'],
      code: {
        lang: 'sql',
        src: `-- Comparatif CA N vs N-1 par Business Unit
SELECT
  bu.name                          AS business_unit,
  DATE_TRUNC('month', s.date)      AS mois,
  SUM(s.revenue)                   AS ca_n,
  SUM(s_prev.revenue)              AS ca_n1,
  ROUND(
    (SUM(s.revenue) - SUM(s_prev.revenue))
    / NULLIF(SUM(s_prev.revenue), 0) * 100, 2
  )                                AS evolution_pct
FROM sales s
JOIN sales s_prev
  ON s.bu_id = s_prev.bu_id
 AND DATE_TRUNC('month', s.date) =
     DATE_TRUNC('month', s_prev.date) + INTERVAL '1 year'
JOIN business_units bu ON s.bu_id = bu.id
GROUP BY 1, 2
ORDER BY 2 DESC, 1;`,
      },
    },
  },
  etl: {
    tag: 'Python · API',
    title: 'Pipeline ETL automatisé',
    desc: 'Automatisation complète d\'un pipeline de collecte, transformation et chargement de données issues de plusieurs sources API.',
    objectif: 'Remplacer un processus manuel quotidien de consolidation de données multi-sources par un pipeline robuste et planifié.',
    methodo: 'Scripts Python de collecte via APIs REST (JSON), déduplication, chargement via SQLAlchemy, orchestration avec Apache Airflow.',
    resultats: 'Gain de 3 heures/jour de travail manuel. Zéro erreur de consolidation depuis la mise en production.',
    chips: ['Python', 'Airflow', 'SQLAlchemy', 'JSON', 'REST API'],
    github: 'https://github.com/votre-pseudo/pipeline-etl',
    media: {
      // images: ['images/airflow_dag.png'],
      code: {
        lang: 'python',
        src: `from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta
import requests, pandas as pd
from sqlalchemy import create_engine

def extract(**ctx):
    r = requests.get('https://api.example.com/data',
                     headers={'Authorization': 'Bearer TOKEN'})
    r.raise_for_status()
    pd.DataFrame(r.json()['results']).to_parquet('/tmp/raw.parquet')

def transform(**ctx):
    df = pd.read_parquet('/tmp/raw.parquet')
    df = df.drop_duplicates('id').fillna({'value': 0})
    df['loaded_at'] = datetime.utcnow()
    df.to_parquet('/tmp/clean.parquet')

def load(**ctx):
    engine = create_engine('postgresql://user:pwd@host/db')
    pd.read_parquet('/tmp/clean.parquet').to_sql(
        'fact_data', engine, if_exists='append', index=False)

with DAG('etl_pipeline', start_date=datetime(2024,1,1),
         schedule_interval='@daily', catchup=False) as dag:
    t1 = PythonOperator(task_id='extract',  python_callable=extract)
    t2 = PythonOperator(task_id='transform',python_callable=transform)
    t3 = PythonOperator(task_id='load',     python_callable=load)
    t1 >> t2 >> t3`,
      },
    },
  },
  comportemental: {
    tag: 'SQL · GitHub',
    title: 'Analyse comportementale utilisateurs',
    desc: 'Segmentation et analyse des parcours utilisateurs sur une plateforme SaaS pour optimiser l\'onboarding et réduire le churn.',
    objectif: 'Comprendre les points de friction dans le parcours utilisateur des 30 premiers jours afin d\'améliorer le taux d\'activation.',
    methodo: 'Requêtes SQL complexes sur logs d\'événements, segmentation par cohortes, analyse funnel, visualisation Python.',
    resultats: '+22 % de taux d\'activation après intégration des recommandations. Identification de 3 étapes clés de drop-off.',
    chips: ['SQL', 'Python', 'Cohortes', 'Funnel Analysis', 'GitHub'],
    github: 'https://github.com/votre-pseudo/analyse-users',
    media: {
      // images: ['images/funnel_analysis.png'],
      code: {
        lang: 'sql',
        src: `-- Analyse funnel onboarding (30 premiers jours)
WITH cohort AS (
  SELECT user_id,
         MIN(DATE(created_at)) AS cohort_date
  FROM events WHERE event = 'signup'
  GROUP BY user_id
),
steps AS (
  SELECT e.user_id,
         c.cohort_date,
         MAX(CASE WHEN e.event = 'signup'          THEN 1 ELSE 0 END) AS s1,
         MAX(CASE WHEN e.event = 'profile_complete' THEN 1 ELSE 0 END) AS s2,
         MAX(CASE WHEN e.event = 'first_action'    THEN 1 ELSE 0 END) AS s3,
         MAX(CASE WHEN e.event = 'activated'       THEN 1 ELSE 0 END) AS s4
  FROM events e
  JOIN cohort c USING (user_id)
  WHERE e.created_at <= c.cohort_date + INTERVAL '30 days'
  GROUP BY 1, 2
)
SELECT cohort_date,
       COUNT(*) AS total, SUM(s1) AS step1,
       SUM(s2) AS step2, SUM(s3) AS step3, SUM(s4) AS activated,
       ROUND(SUM(s4)::numeric / COUNT(*) * 100, 1) AS activation_rate
FROM steps
GROUP BY 1 ORDER BY 1;`,
      },
    },
  },
  exoplanetes: {
    tag: 'Python · dbt · GCP · Power BI · ML',
    title: 'Projet Exoplanètes – NASA',
    desc: 'Collecte et traitement de données NASA sur les exoplanètes, modélisation OLAP en étoile, tableaux de bord Power BI et modèle de Machine Learning pour prédire le potentiel d\'habitabilité.',

    contexte: 'Ce projet exploite les données publiques de la NASA sur les exoplanètes découvertes afin d\'en extraire des insights et de développer un modèle prédictif d\'habitabilité. Il couvre l\'ensemble de la chaîne data : de la collecte brute jusqu\'à la visualisation et l\'intelligence artificielle.',
    objectif: 'Construire un pipeline data complet (collecte → transformation → modélisation → visualisation → ML) autour des données exoplanètes de la NASA, et prédire le potentiel d\'habitabilité de chaque exoplanète grâce au Machine Learning.',
    outils: ['Python', 'dbt', 'GCP (BigQuery)', 'Power BI', 'Scikit-learn', 'Pandas', 'SQL'],
    methodo: '<ul><li>Collecte et préparation de données issues des archives NASA.</li><li>Transformation et structuration des données avec dbt et GCP (BigQuery).</li><li>Conception d\'un modèle OLAP en étoile pour l\'analyse multidimensionnelle.</li><li>Création de visualisations et tableaux de bord interactifs avec Power BI.</li><li>Développement d\'un modèle de Machine Learning pour prédire le potentiel d\'habitabilité des exoplanètes.</li></ul>',
    apports: 'Un pipeline data end-to-end opérationnel, des dashboards permettant d\'explorer les caractéristiques des exoplanètes et un modèle ML capable d\'identifier les candidates les plus prometteuses pour l\'habitabilité.',
    competences: [
      'Data Engineering — Collecte, nettoyage et pipelines de données NASA',
      'dbt & GCP — Transformation et structuration cloud des données',
      'Modélisation OLAP — Conception d\'un schéma en étoile pour l\'analyse multidimensionnelle',
      'Power BI — Création de tableaux de bord et visualisations interactives',
      'Machine Learning — Modèle de prédiction du potentiel d\'habitabilité (Scikit-learn)',
    ],

    chips: ['Python', 'dbt', 'GCP', 'BigQuery', 'Power BI', 'Scikit-learn', 'Pandas', 'SQL'],
    media: {
      codes: [],
    },
  },
};

// ─── NAVIGATION ONGLETS ───────────────────────────────────────────────────────
const tabs = document.querySelectorAll('.tab');
const navBtns = document.querySelectorAll('.nav-btn');

function switchTab(name) {
  tabs.forEach(t => t.classList.remove('active'));
  navBtns.forEach(b => b.classList.remove('active'));
  const target = document.getElementById('tab-' + name);
  const btn = document.getElementById('btn-' + name);
  if (target) target.classList.add('active');
  if (btn) btn.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

navBtns.forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// ─── MODAL ────────────────────────────────────────────────────────────────────
const overlay = document.getElementById('modal-overlay');
const closeBtn = document.getElementById('modal-close');

function buildGallery(media) {
  const container = document.getElementById('modal-gallery');
  container.innerHTML = '';
  if (!media) return;

  // Images
  if (media.images && media.images.length) {
    const strip = document.createElement('div');
    strip.className = 'gallery-images';
    media.images.forEach(src => {
      const wrap = document.createElement('div');
      wrap.className = 'gallery-img-wrap';
      const img = document.createElement('img');
      img.src = src;
      img.alt = 'Capture projet';
      img.addEventListener('click', () => openLightbox(src));
      wrap.appendChild(img);
      strip.appendChild(wrap);
    });
    container.appendChild(strip);
  }

  // Code (single)
  if (media.code) {
    container.appendChild(buildCodeBlock(media.code.lang, media.code.src));
  }

  // Codes (multi-tab)
  if (media.codes && media.codes.length) {
    const wrapper = document.createElement('div');
    wrapper.className = 'gallery-code-tabs-wrapper';

    // Tab bar
    const tabBar = document.createElement('div');
    tabBar.className = 'gallery-code-tabbar';
    media.codes.forEach((c, i) => {
      const btn = document.createElement('button');
      btn.className = 'gallery-code-tab' + (i === 0 ? ' active' : '');
      btn.textContent = c.label;
      btn.dataset.tab = i;
      tabBar.appendChild(btn);
    });
    wrapper.appendChild(tabBar);

    // Code panels
    media.codes.forEach((c, i) => {
      const panel = document.createElement('div');
      panel.className = 'gallery-code-panel' + (i === 0 ? ' active' : '');
      panel.dataset.panel = i;
      panel.appendChild(buildCodeBlock(c.lang, c.src));
      wrapper.appendChild(panel);
    });

    // Tab switching
    tabBar.addEventListener('click', e => {
      const btn = e.target.closest('.gallery-code-tab');
      if (!btn) return;
      const idx = btn.dataset.tab;
      tabBar.querySelectorAll('.gallery-code-tab').forEach(b => b.classList.remove('active'));
      wrapper.querySelectorAll('.gallery-code-panel').forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      wrapper.querySelector(`.gallery-code-panel[data-panel="${idx}"]`).classList.add('active');
    });

    container.appendChild(wrapper);
  }
}

function buildCodeBlock(lang, src) {
  const block = document.createElement('div');
  block.className = 'gallery-code';
  block.innerHTML = `
    <div class="gallery-code-header">
      <span class="gallery-code-lang">${lang}</span>
      <button class="gallery-code-copy" title="Copier">Copier</button>
    </div>
    <pre><code>${escHtml(src)}</code></pre>`;
  block.querySelector('.gallery-code-copy').addEventListener('click', function () {
    navigator.clipboard.writeText(src).then(() => {
      this.textContent = 'Copié ✓';
      setTimeout(() => this.textContent = 'Copier', 2000);
    });
  });
  return block;
}

function escHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function openModal(projectId) {
  const p = PROJECTS[projectId];
  if (!p) return;

  document.getElementById('modal-tag').textContent = p.tag;
  document.getElementById('modal-title').textContent = p.title;
  document.getElementById('modal-desc').textContent = p.desc;

  // Mode enrichi (projet avec contexte) vs mode classique
  const baseSection = document.querySelector('.modal-sections');
  const extraEl = document.getElementById('modal-extra-sections');
  extraEl.innerHTML = '';

  if (p.contexte) {
    // Masquer la grille 3 colonnes, tout passe en sections dynamiques ordonnées
    if (baseSection) baseSection.style.display = 'none';

    // Ordre : Contexte → Objectif → Méthodologie → Outils → Résultats & Apports → Compétences
    extraEl.appendChild(buildModalSection('Contexte', p.contexte));

    if (p.objectif) {
      extraEl.appendChild(buildModalSection('Objectif', p.objectif, true));
    }
    if (p.methodo) {
      extraEl.appendChild(buildModalSection('Méthodologie', p.methodo, true));
    }
    if (p.outils && p.outils.length) {
      const content = p.outils.map(o => `<span class="chip chip-tool">${o}</span>`).join('');
      extraEl.appendChild(buildModalSection('Outils & Technologies', content, true));
    }
    if (p.apports) {
      extraEl.appendChild(buildModalSection('Résultats & Apports', p.apports));
    }
    if (p.competences && p.competences.length) {
      const list = '<ul class="modal-competences-list">' +
        p.competences.map(c => `<li>${c}</li>`).join('') + '</ul>';
      extraEl.appendChild(buildModalSection('Compétences développées', list, true));
    }
  } else {
    // Mode classique : grille 3 colonnes
    if (baseSection) baseSection.style.display = '';
    document.getElementById('modal-objectif').textContent = p.objectif || '';
    document.getElementById('modal-methodo').textContent = p.methodo || '';
    document.getElementById('modal-resultats').textContent = p.resultats || '';
  }

  // Chips
  document.getElementById('modal-chips').innerHTML =
    p.chips.map(c => `<span class="chip">${c}</span>`).join('');

  // Liens (Demo)
  const descLinksEl = document.getElementById('modal-desc-links');
  descLinksEl.innerHTML = '';

  if (p.demo) {
    const btnDemo = document.createElement('a');
    btnDemo.href = p.demo;
    btnDemo.target = '_blank';
    btnDemo.className = 'modal-demo';
    btnDemo.innerHTML = `
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2 2V8a2 2 0 0 1 2-2h6" />
        <polyline points="15 3 21 3 21 9" />
        <line x1="10" y1="14" x2="21" y2="3" />
      </svg>
      Voir l'application de recommandation
    `;
    descLinksEl.appendChild(btnDemo);
  }


  // Gallery
  buildGallery(p.media);

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function buildModalSection(title, content, isHtml = false) {
  const div = document.createElement('div');
  div.className = 'modal-section modal-section-extra';
  const h4 = document.createElement('h4');
  h4.textContent = title;
  div.appendChild(h4);
  const body = document.createElement('div');
  body.className = 'modal-section-body';
  if (isHtml) body.innerHTML = content;
  else body.textContent = content;
  div.appendChild(body);
  return div;
}

// Ouvrir depuis les cartes
document.querySelectorAll('.project-link[data-project]').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    openModal(link.dataset.project);
  });
});

function closeModal() {
  overlay.classList.remove('open');
  document.body.style.overflow = '';
}

// Fermer
closeBtn.addEventListener('click', closeModal);
overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox() || closeModal(); });

// ─── LIGHTBOX ────────────────────────────────────────────────────────────────
let lightboxEl = null;

function openLightbox(src) {
  lightboxEl = document.createElement('div');
  lightboxEl.className = 'lightbox';
  lightboxEl.innerHTML = `<img src="${src}" alt="Agrandie">`;
  lightboxEl.addEventListener('click', closeLightbox);
  document.body.appendChild(lightboxEl);
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  if (lightboxEl) {
    lightboxEl.remove();
    lightboxEl = null;
    return true;    // signal: lightbox was open
  }
  return false;
}
