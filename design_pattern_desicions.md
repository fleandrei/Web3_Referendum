# design pattern desicions

## Behavioral Patterns

### Guard Check
La majorité des fonction du projet implémentent ce pattern via des require. Il s'agit généralement de vérifier les droits d'accès (Auhtorities only, constitution only...), que nous sommes à la bonne étape d'un process (pour les l'Agora, la Delegation et Majority_Judgment_Ballot) que les données en entrées sont correctes (pas l'adresse 0, les paramètres des register et des des délégations sont cohérents ...)

### State Machine
Les Institutions de gouvernance (Agora et Delegation) ainsi que le contrat de vote Majority_Judgment_Ballot implémentent ce pattern. Les trois implémentent des processus démocratique qui leur sont propres et qui sont divisés en plusieurs étapes. Ces étapes sont implémentés via des énums. Chaque étape ouvre l'accès à des fonctionnalités spécifiques et interdit l'appel à d'autres.
Par exemple, pour l'Agora, nous avons les états suivants:

* _PETITION_: Chaque citoyen peut soumettre une nouvelle proposition référendaire (Titre + Description) démarant ainsi un nouveau processus référendaire. Les citoyens peuvent également participer à l'élaboration du corpus de Function call d'une proposition référendaire qui a déjà été soumise ou signer cette dernière.
* _VOTE_: Etape pendant laquelle les citoyens votent pour la proposition de corpus via un contrat implémentant l'interface IVote.
* _ADOPTED_: Une proposition de corpus a été adoptée. Le référendum a aboutit à une loi (titre + description + corpus de function call). Cette loi est composée d'une liste de function call qui doivent être exécutées par le citoyens volontaires.
* _EXECUTED_ : Lorsque toutes les function call ont été exécutés, la loi est considérée comme exécutée et le processus référendaire est désormais terminé.
* _REJECTED_: Si une proposition référendiare n'obtient pas suffisament de signatures ou que le vote blanc l'emporte dans le référendum, alors la proposition référendaire est rejetée et le processus référendaire correspondant est terminé.

Nous avons une structure similaire pour les deux autres contrats.

## Security Patterns

### Acces Restriction
Le projet implémente un système de droit d’exécutions des fonction d’état qui permette d’éviter les comportements anormale. Il y a ainsi 4 droits d’accès correspondant à des modifiers spécifiques:

 * _Citizens Only_ : Seuls les citoyens sont autorisés à exécuter la fonction. Les citoyens sont des comptes enregistrés dans le contrat Citizens_Register et qui ont de ce fait le droit de participer à la vie politique de la DAO. Ce modifier est essentiellement utilisé pour l’élaboration des propositions de lois dans l’Agora ainsi que pour l’élection des membres des délégations
 * _Constitution Only_ : Seuls le contrat Constitution est autorisé à exécuter la fonction. Il s’agit généralement de fonction visant à modifier les paramètres du contrat.
 * _Delegation Only_ : Utilisé au sein d’un contrat Delegation seul les membres de la délégation ont le droit d’appeler la fonction. Cela est utilisé pour les fonctions ayant attrait à l’élaboration de projets de loi par la délégation.
 * _Authorities Only_ : Les contrats de type Register possèdent une liste d’adresses (Register_Authorities) correspondants aux contrats ayant le droit d’interagir avec eux. Seuls ces contrats peuvent faire appel aux fonctions ayant le modifier Authorities_Only. 


On peut constater que les contrats de type register (Constitution, API_Register, Loi et Citizens_Register) ne peuvent être appelés que par l’Agora, les Delegation et la Constitution. Il n’est donc pas possible pour un citoyen d’interagir directement avec ces contrats. Ils doivent pour cela passer par les contrats de gouvernance que sont l’Agora et les Delegation. Cela permet d’isoler les données d’intérêt de la DAO, contenues dans les register ; de l'ensemble des citoyens. 
Par ailleurs, étant donné que la majorité des fonctions du projet sont soumises à l’un de ces modifier, il est difficile pour un compte étranger à la DAO d’interagir avec elle. 

### Checks Effects Interactions
Toutes les fonctions du projet implémentent ce pattern afin d'éviter les attaques par réentrance. Ce pattern a été particulièrement suivit pour les fonctions interagissant avec des contrats potentiellement à risque tel que les contrats IVote, IDelegation ainsi que ceux référencés dans les API des contrats "API_Register".

## Economic Patterns
### Tight Variable Packing
Les variables d'états et les champs des structures sont déclarées dans un ordre qui permettent d'optimiser la place utilisé en faisant, lorsque cela est possible, entrer plusieurs variables de petite taille dans le même slot. Par ailleurs, le choix des type des variables statiques est ooptimisé. Ainsi, les variables représentant un pourcentage en décimal 2 sont stocké sur le plus petit uint pouvant les contenir, à savoir uint16.



