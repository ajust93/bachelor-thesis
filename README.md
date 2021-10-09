# bachelor-thesis

Online shops are capable of showing visitors dynamic and personalized prices for the same product.

Dynamic prices are equal for all visitors and can change for example dependent on time or day of the week.

Personalized prices are different for visitors, although they view the same product at the same time. A factor can be the different browsing histories, which enable web tracking via collected cookies.

---

My Google Chrome Extension trains artificial user profiles automatically, allowing the analysis of prices with additional software afterwards.

The additional software for collecting product prices by using the trained user profiles, was written by two fellow students and is not included in this repository.

By the way: Selenium Web Driver is somewhat capable of doing the task of training user profiles, but the usage of Selenium is detectable and therefore not suitable, because the trained profiles could be flagged as potential bots. This would distort the whole study.

---

Some additional information about my extension:

- focuses on training 4 user profile groups: rich, poor, female, male (maps.js contains hard coded information about the selected websites for collecting cookies)

- cronjobs opened Google Chrome automatically at specific times and therefore started the training on 16 virtual machines (4 for each profile group)

- the PHP API was necessary for logging important information in a PostgreSQL database (like problematic websites, which potentially detected the bots and afterwards had different http status codes - these websites should be skipped in future training sessions)

- the training should execute realistically, hence for example delays and scrolling durations were randomized for different sessions
