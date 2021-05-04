# Test Explication

## Introduction

Ce projet contient 10 smart contracts (dont 2 hérités) plus ou moins interdépendants entre eux. Nous avons testé les smart contracts en commençant par les plus indépendants et en finissant par ceux qui ont le plus de dépendances vis à vis des autres. 

Les tests ont été réalisés en javascript avec les outils de la library Openzeppelin « test-helper ». 
Les arguments passés en paramètre des fonctions testées sont en général générés aléatoirement.

Note: Il n'y a pas de correspondance exacte entre les tests qui sont énumérés dans ce document (au sein des sections Tests) et les sections it(...) dans les scripts de test.

## Loi_Test.js

### Présentation

Dans ce fichier, on teste le smart contract _Loi.sol_ qui permet d’éditer une liste de lois/textes sur la blockchain. Ce smart contract étant assez simple, on a également testé les fonctionnalités héritées des contrats Instance.sol et Register.sol.


### Tests:

* _Test de Institution.sol_
	* Seul le contrat Constitution peut changer le champs _Constitution_Address_ d'une institution
	* Le contrat Constitution ne peut pas modifier le champs _Constitution_Address_ d'une Institution en le fixant à l'adresse null
	* Le contrat Constitution change le champs _Constitution_Address_ d'une Institution par une adresse valide et l'event "Constitution_Changed" est émit
* _Test de Register.sol_	
	* Seul le contrat Constitution peut ajouter une adresse à la liste "Authority_Register"
	* Le contrat Constitution ajoute une adresse à la liste "Authority_Register" avec succès et l'event "Authority_Added" est émit
	* Le contrat Constitution ne peut pas ajouter deux fois la même adresse à la liste "Authority_Register".
	* Seul le contrat Constitution peut supprimer une adresse de la liste "Authority_Register"
	* Le contrat Constitution supprime une adresse de la liste "Authority_Register" avec succès et l'event "Authority_Removed" est émit
	* Le contrat Constitution ne peut pas supprimer une adresse non existante dans la liste "Authority_Register".
* _Etat initial_ :
	* On vérifie que le contrat Loi dépend bien du bon contrat Constitution (On vérifie la variable d'état "Constitution_Address).
	* On vérifie que le contrat Loi a le bon nom (variable d'état Name)
	* On vérifie que le contrat Loi est bien de type "Loi" (on vérifie la variable d'état "Type_Institution").
	* On vérifie que la liste "Register_Authorities" est correcte (Elle contient l'adresse du contrat Agora).
* _Ajout d’une loi (Loi.sol)_
	* Seul une adresse de « Register_Authorities » peut créer une loi
	* On ne peut pas créer deux lois avec le même titre (le champs Title est l’Id de la loi)
	* L’ajout d’une loi par un membre de l’« Register_Authorities » entraîne les bonnes mises à jour des variables d’états et l’émission d’un event « Law_Created »
* _Modification de la Description d’une loi :_
	* Seul une adresse de « Authority_Register » peut modifier la description d’une loi
	* On ne peut pas modifier la description d’une loi qui n’existe pas.
	* On change la description d’une loi et l’event « Description_Changed » est émit.
* _Ajout d’un article à une loi :_
	* Seul une adresse de « Authority_Register » peut ajouter un article à une loi
	* On ne peut pas ajouter d’article à une loi n’existant pas
	* On ne peut pas ajouter deux fois le même article (même titre et même description), même au sein de deux lois différentes.
	* On ajoute un nouveau article à une loi existante et un event « Article_Created » est émis.
* _Suppression d’un article d’une loi :_
	* Seul une adresse de « Authority_Register » peut supprimer un article d’une loi
	* On ne peut pas supprimer un article si il n’existe pas ou si la loi correspondante n’existe pas
	* On ne peut pas supprimer un article existant si on ne spécifie pas la bonne loi existante.
	* On supprime un article en vérifiant qu’il n’est plus contenu dans la loi et un event «Article_Removed » est émit.
* _Suppression d'une loi:_
	* Seul une adresse de « Authority_Register » peut supprimer une loi
	* On ne peut pas supprimer une loi qui n'existe pas.
	* On supprime une loi en vérifiant qu'elle n'est plus contenue dans le contrat et qu'un event "Law_Removed" est émit.


## API_Register_Test.js

### Présentation

Dans ce fichier, on teste le smart contract _API_Register.sol_ qui permet d’éditer une liste de smart contrats tiers et de fonctions associées; ainsi que d'exécuter ces dernières. Les tests sont similaires à ceux qui ont été réalisés pour le contrat Loi.sol à la différence qu'il s'agit ici non pas de lois mais de smart contrat; et qu'il faut également tester leur exécution. Pour ce dernier point, nous avons utiliser un smart contrat test _SimpleStorage.sol_ légèrement modifié de manière à ce que la fonction _set_, en plus de l'entier x, prenne également en paramètre un bytes32 y.



### Tests:
* _Etat initial:_
	* On vérifie que le nom et la constitution du contrat sont correctes.
	* On vérifie que la le contrat est bien de type "API_Register"
	* On vérifie que la liste "Register_Authorities" est correcte (Elle contient l'adresse du contrat Agora). 
* _Ajout d'un nouveau contrat tiers:_
	* Seul une adresse de « Authority_Register » peut ajouter un nouveau contrat tiers à l'API
	* On ne peut pas ajouter deux fois le même contrat à l'API
	* On ajoute un contrat à l'API en vérifiant que le state a bien été mis à jour et que l'évent "Contract_Created" a bien été émit.
* _Ajout d'une fonction à un contrat tiers:_
	* Seul une adresse de « Authority_Register » peut ajouter une nouvelle fonction à un contrat de l'API
	* On ne peut pas ajouter une fonction appartenant à un contrat qui n'est pas dans l'API.
	* On ajoute une fonction à un contrat de l'API et on vérifie que les changements d'états correspondants ont bien été effectués. On vérifie également l'émission de l'event "Function_Added".
* _Changemnt des paramètres d'un contrat de l'API:_
	* Seul une adresse de « Authority_Register » peut modifier les paramètres d'un cotrat de l'API.
	* On ne peut pas modifier les paramètres d'un contrat qui n'estt pas enregistré dans l'API.
	* On change le nom et la description d'un contrat de l'API et l'event "Contract_param_Changed" est émit.
* _Suppression d'une fonction d'un contrat de l'API:_ 
	* Seul une adresse de « Authority_Register » peut supprimer une fonction de l'API.
	* On ne peut pas supprimer une fonction d'un contrat qui n'est pas enregistré dans l'API.
	* On en peut pas supprimer une fonction qui n'est pas enregistrée dans l'API
	* On supprime une fonction et on vérifie qu'elle n'est plus contenue dans le contrat correspondant. On vérifie que l'event "Function_Removed" a bien été émit.
* _On supprime un contrat de l'API:_
	* Seul une adresse de « Authority_Register » peut supprimer un contrat de l'API.
	* On ne peut pas supprimer un contrat qui n'est pas enregistré dans l'API.
	* On supprime un contrat en vérifiant que lui et ses fonctions ne sont plus contenues dans l'API et qu'un event "Contract_Removed" a été émit.
* _On exécute une fonction d'un contrat contenu dans l'API:_
	* Seul une adresse de « Authority_Register » peut exécuter une fonction de l'API.
	* On ne peut pas exécuter une fonction appartenant à un contrat qui n'a pas été enregistré dans l'API
	* On ne peut pas exécuter une fonction qui n'est pas enregistrée dans l'API
	* On exécute la fonction "set" du smart contrat _SimpleStorage_ via le contrat _API_Register_ (SimpleStorage et sa fonction d'état sont enregistrés dans l'API de _API_Register_). On Vérifie que l'état de _SimpleStorage_ a bien modifié en conséquence, que les receipt de cet appel de fonction sont correct et que l'event "Function_Executed" a bien été émit.



## DemoCoin_Test.js

### Présentation

Dans ce fichier, on teste les fonctionnalités du token ERC20 DemoCoin. On ne vérifie pas les fonctionnalitées héritées du smart contract _ERC20_ de openzeppelin mais uniquement celles qui ont été rajoutées pour les besoins du projet.

### Tests:
* _Initialisation:_
	* On vérifie que le contrat DemoCoin conntaît l'address du contrat _Constitution_ (via la variable _Constitution_Address_) et que cette dernière est contenue dans les listes de Minter (_Mint_Authorities_) et de Burner (_Burn_Authorities_).
	* On vérifie que les owner de token initiaux détiennent bien les sommes qui leur ont été attribés lors du déploiement du contrat DemoCoin.
* _Modification des listes Minter_Authorities et Burner_Authorities:_
 	* Seul le contrat Constitution peut modifier les listes (ajouter et supprimer des membres) des adresses authorisées à Mint et à Burn des tokens.
	* Pour chaque une des deux listes, on ne peut ajouter deux fois la même adresse.
	* Pour chaque une des deux listes, on ne peut supprimer une adresse qui n y a pas été enregistrée.
	* Pour chaque une des deux listes, on ne peut supprimer l'adresse du Constitution contrat qui y est présent par défaut.
	* La Constitution ajoute une adresse à la liste Mint_Authorities et on vérifie que l'event "Minter_Added" est émit.
	* La Constitution ajoute une adresse à la liste Burn_Authorities et on vérifie que l'event "Burner_Added" est émit.
	* La Constitution supprime une adresse de la liste Mint_Authorities et on vérifie que l'event "Minter_Removed" est émit.
	* La Constitution supprime une adresse de la liste Burn_Authorities et on vérifie que l'event "Burner_Removed" est émit.
* _Opérations Mint/Burn:_
	* Seul une adresse de "Mint_Authorities" peut minter des tokens
	* Une adresse de "Mint_Authorities" crée des DemoCoin token à une adresse donnée.
	* Seul une adresse de "Burn_Authorities" peut burn des tokens
	* Une adresse de "Burn_Authorities" brule des token à une adresse donnée.


## Citizen_Register_Test.js

### Présentation
Dans ce fichier on teste les fonctionnalités du contrat _Citizens_Register_ chargé de la gestion des citoyens d'un projet Web3 Direct Democracy. Ce contrat possède deux listes d'authorités, _Citizens_Registering_Authorities_ et _Citizens_Banning_Authorities_ chargées respectivement d'enregistrer de nouveaux citoyens et de bannir (pendant un temps limité ou définitivement)ceu qui ont un mauvais comportement.

### Tests:
* _Etat initial:_
	* On vérifie que les comptes qui ont été renseignés en tant que citoyens initiaux du projet dans le constructeur du contrat _Citizens_Register_ ont bien été ajoutés à la liste des citoyens du projet Web3 Direct Democracy
	* La quantité de token à créer (mint) pour un nouveau citoyen, définit par la variable d'état _New_Citizen_Mint_Amount_, est bien celle qui a été définit dans le constructeur.
	* Seul le contrat _Constitution_ peut modifier la variable _New_Citizen_Mint_Amount_.
	* Le contrat _Constitution_ modifie avec succès la variable _New_Citizen_Mint_Amount_ et l'event "new_citizen_mint_amount_Set" est émit.
* _Ajout d'une nouvelle adresse à Citizens_Registering_Authorities:_
	* Seul le contrat _Constitution_ peut ajouter une adresse à _Citizens_Registering_Authorities_.
	* Le contrat _Constitution_ ajoute une nouvelle adresse à _Citizens_Registering_Authorities_ avec succès et l'event "Registering_Authority_Added" est émit.
	* On ne peut ajouter deux fois la même adresse à _Citizens_Registering_Authorities_.
* _Ajout d'une nouvelle adresse à Citizens_Banning_Authorities:_
	* Seul le contrat _Constitution_ peut ajouter une adresse à _Citizens_Banning_Authorities_.
	* Le contrat _Constitution_ ajoute une nouvelle adresse à _Citizens_Banning_Authorities_ avec succès et l'event "Banning_Authority_Added" est émit.
	* On ne peut ajouter deux fois la même adresse à _Citizens_Banning_Authorities_.
* _Supression d'authorités (dans les deux listes):_
	* Seul le contrat _Constitution_ peut supprimer une adresse de _Citizens_Registering_Authorities_ ou de  _Citizens_Banning_Authorities_. Un membre de ces listes peut également se supprimer lui même.
	* Le contrat _Constitution_ supprime une adresse de _Citizens_Registering_Authorities_ avec succès et l'event "Registering_Authority_Removed" est émit.
	* Le contrat _Constitution_ supprime une adresse de _Citizens_Banning_Authorities_ avec succès et l'event "Banning_Authority_Removed" est émit.
	* Deux adresses appartenant chaque une à une des deux listes, se retirent d'elles même avec succès et les events "Registering_Authority_Removed" et "Banning_Authority_Removed" sont émit.
	* On ne peut adresse qui n'est enregistré ni dans _Citizens_Registering_Authorities_ ni dans _Citizens_Banning_Authorities_.
* _Ajout et modification d'un citoyen:_
	* Seul une adresse de _Citizens_Registering_Authorities_ peut ajouter un nouveau citoyen à la DAO.
	* On ne peut pas ajouter deux fois le même citoyen.
	* Une adresse de _Citizens_Registering_Authorities_ ajoute un nouveau citoyen avec succès et l'event "New_Citizen" est émit.
	* Seul une adresse de _Citizens_Registering_Authorities_ peut modifier les données d'un citoyens, contenues dans le champs _Data_ d'un structure _Citizen_.
	* On ne peut pas modifier le champ _Data_ d'un citoyen qui n'a pas été ajouté au préalable à la DAO.
	* Une adresse de _Citizens_Registering_Authorities_ modifie avec succès les données d'un citoyen et l'event "Citizen_Data_Set" est émit.
* _Bannissement:_
	* Seul une adresse de _Citizens_Banning_Authorities_ peut bannir un citoyen.
	* On en peut pas bannir un citoyen qui n'est pas enregistré dans le contrat _Citizens_Register_.
	* Une adresse de _Citizens_Banning_Authorities_ bannit temporairement un citoyen pour une durée indéterminée (le timestamps de fin de peine est nulle) avec succès et l'event "Citizen_Banned" est émit.
	* Une adresse de _Citizens_Banning_Authorities_ bannit temporairement un citoyen pour une durée déterminée (le timestamps de fin de peine est non nulle) avec succès et l'event "Citizen_Banned" est émit.
	* Seul une adresse de _Citizens_Banning_Authorities_ peut abnnir de manière permanente un citoyen.
	* On ne peut pas bannir de manière permanente un citoyen qui n'est pas enregistré dans le contrat _Citizens_Register_.
	* Une adresse de _Citizens_Banning_Authorities_ bannit avec succès un citoyen de manière permanente et l'event "Citizen_Permanently_Banned" est émit.
* _Acquittement des citoyens:_
	* Seul une adresse de _Citizens_Banning_Authorities_ peut gracier un citoyen qui a été bannit.
	* On ne peut pas gracier un citoyen qui n'est pas enregistré dans le contrat _Citizens_Register_.
	* On ne peut pas gracier un citoyen qui a été de bannit de manière permanente.
	* Une adresse de _Citizens_Banning_Authorities_ gracie un citoyen avec succès un citoyen qui a été bannit de manière temporaire et l'event "Citizen_Ban_Over" est émit.
* _Fin de peine:_ 
	* Un citoyen qui n'a pas été bannit ne peut mettre fin à sa peine (puisqu'elle est inexistante).
	* Un citoyen qui a été bannit de manière temporaire mais pour un temps indéfinit ne peut mettre fin de sa peine (puisque son timestamps de fin n'est justement pas définit).
	* Un citoyen qui a été bannit de manière temporaire et pour un temps définit ne peut mettre fin à sa peine avant la date de fin de cette dernière.
	* Un citoyen qui a été bannit de manière temporaire et pour un temps définit met fin à sa peine (une fois qu'elle est terminée) avec succès et l'event "Citizen_Ban_Over"

## Majority_Judgment_Ballot_Test.js

### Présentation
Dans ce fichier, on teste le fonctionnalités du contrat _Majority_Judgment_Ballot_ qui implémente le scrutin par jugement majoritaire et qui gère l'aspect vote pour les contrats de gouvernance (Agora et Delegation). Ce contrat peut géréer indépendament plusieurs sessions de votes en même temps. Chaque session prend en paramètre (entre autre) le nombre N de propositions pouvant être choisies par les votants ainsi que le nombre M de proposition victorieuses pouvant être choisies parmit les N proposées.
Les votes au sein de ces tests sont faits aléatoirement.

### Tests

* _Création d'une nouvelle session de vote (via la fonction Create_Ballot):_
	* L'adresse _Voter_Register_Address_ passée en paramètre, et correspondant à l'adresse du contrat tenant la liste des comptes authorisés à voter au sein de la session de vote; doit être différent de address(0).
	* Le paramètres _check_voter_selector_ correspond au function selector de la fonction qui au sein du contrat _Voter_Register_Address_ prend une adresse en entrée et renvoie un booléen indiquant si cette dernière est enregistrée dans la liste de comptes authorisés à participer au vote. Ce paramètre est un bytes4 qui doit être non différent de bytes(0).
	* On ne peut pas créer une session de vote avec une durée de vote nulle (Le paramètre _vote_duration_ est non nulle).
	* Le nombre de propositions _Proposition_Number_ (N) doit être non nulle.
	* Le nombre de propositions _Proposition_Number_ doit être strictement supérieur au nombre _Max_Winning_Propositions_Number_ (M) de places.
	* Le nombre _Max_Winning_Propositions_Number_ (M) de propositions victorieuses ne peut pas être égale à 0.
	* Un compte crée avec succès une session de vote avec _Proposition_Number_ d'abord strictement supérieur à 1, puis égale à 1. Dans les deux cas, l'event "Ballot_Created" est crée.
	* On ne peut crée la même session de vote deux fois.
* _Vote en claire (fonction Vote_Clear):_
	* Seul un compte contenu dans le contrat d'adresse _Voter_Register_Address_ peut voter.
	* On ne peut voter que dans une session de vote existante.
	* Si la session est paramètrée (paramètre _vote_validation_duration_ non nulle) pour que les votes soient hashés, alors on ne peut voter claire.
	* Le Array de choix doit avoir une taille de N. En effet, dans un scrutin de jugement majoritaire, il faut donner une notation à chaque une des N propositions.
	* Un même compte ne peut voter deux fois dans une même session de vote.
	* Un compte authorisé à voter vote en claire avec succès et l'event "Voted_Clear" est émit.
* _Vote Hashé (fonction Vote_Hashed):_
	* Seul un compte contenu dans le contrat d'adresse _Voter_Register_Address_ peut voter.
	* On ne peut voter que dans une session de vote existante.
	* Si la session est paramètrée (paramètre _vote_validation_duration_ nulle) pour que les votes soient entrée en claire, alors on ne peut entrer un vote hashé.
	* Un même compte ne peut voter deux fois dans une même session de vote.
	* Un compte authorisé à voter rentre un vote hashé avec succès et l'event "Voted_Hashed" est émit.
* _Fin de la phase de vote pour les sessions de votes paramètrées pour le vote hashé:_
	* On ne peut mettre fin à la phase de vote d'une session non existante
	* On ne peut pas mettre fin à la phase de vote avant que la durée nécéssaire ne se soit écoulée.
	* Un compte met fin à la phase de vote avec succès et l'event "Begin_Validation" est émit.
* _Validation des votes:_
	* Un citoyen ne peut valider son vote que durant la phase de Validation.
	* Il faut que le choix de vote passé en paramètre avec le salt pour valider le hash soit un tableaux de taille N. En effet, dans un scrutin de jugement majoritaire, il faut donner une notation à chaque une des N propositions.
	* Seul les comptes ayant soumit un hash en guise de vote durant la phase de vote peuvent valider leur choix.
	* Le choix de vote passé en paramètre avec le salt doit correspondre au hash qui a été soumit lors de la phase de vote.
	* Un citoyen ne peut valider son vote qu'une seule fois.
	* Un citoyen valide son vote avec succès et l'event "Validated_Vote" est émit.
* _Fin de la phase de vote pour les sessions de votes paramètrées pour le vote en claire (Ce qui implique le comptage des voix et la fin de la session de vote):_
	* Comptage des voix avec succès pour N=1 (et donc M=1). La seule proposition de la session de vote est élue d'office. L'event "Vote_Finished" est émit.
	* Comptage des voix avec succès pour N>1 et M=1. L'event "Vote_Finished" est émit.
	* Comptage des voix avec succès pour N>1 et M>1 (mais N>M). L'event "Vote_Finished" est émit.
	* Comptage des voix mais personne n'a voté. C'est la proposition 0 (proposition par défault) qui gagne, ce qui correspond à un vote blanc. L'event "Vote_Finished" est émit.
* _Fin de la phase de Validation:_
	* On ne peut pas mettre fin à la phase de validation des votes si on n'est pas à cette étape.
	* On ne peut pas mettre fin à la phase de validation des votes avant que la durée nécéssaire ne se soit écoulée.
	* Un citoyen met fin à la phase de validation des votes (ce qui entraîne le comptage des voix et la fin de la session) avec succès et l'event "Vote_Finished" est émit.




	* 
	 
	
