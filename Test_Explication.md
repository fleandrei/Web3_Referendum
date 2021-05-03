# Test Explication

## Introduction

Ce projet contient 10 smart contracts (dont 2 hérités) plus ou moins interdépendants entre eux. Nous avons testé les smart contracts en commençant par les plus indépendants et en finissant par ceux qui ont le plus de dépendances vis à vis des autres. 

Les tests ont été réalisés en javascript avec les outils de la library Openzeppelin « test-helper ».

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


