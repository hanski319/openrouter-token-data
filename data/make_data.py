import json, os

abbr = {
    'a/': 'anthropic/',
    'g/': 'google/',
    'oi/': 'openai/',
    'ml/': 'meta-llama/',
    'mist/': 'mistralai/',
    'ds/': 'deepseek/',
    'qw/': 'qwen/',
    'nr/': 'nousresearch/',
    'xai/': 'x-ai/',
    'ms/': 'microsoft/',
    'gr/': 'gryphe/',
    'or/': 'openrouter/',
    'liquid/': 'liquid/',
    'cohere/': 'cohere/',
}

def expand(s):
    for k, v in abbr.items():
        if s.startswith(k):
            return v + s[len(k):]
    return s

raw = """2024-09-02|g/gemini-flash-1.5=18036083793,gr/mythomax-l2-13b=15782364239,a/claude-3.5-sonnet=15106033385,oi/gpt-4o-mini=11008923126,a/claude-3.5-sonnet:beta=6069962788,nr/hermes-3-llama-3.1-405b=5998594036,ms/wizardlm-2-8x22b=5366813594,ml/llama-3.1-70b-instruct=5062623120,ml/llama-3.1-8b-instruct=3680213620
2024-09-09|g/gemini-flash-1.5=40344841271,gr/mythomax-l2-13b=14415581965,oi/gpt-4o-mini=11271514042,a/claude-3.5-sonnet:beta=8874903186,ms/wizardlm-2-8x22b=8033647921,a/claude-3.5-sonnet=6731811325,nr/hermes-3-llama-3.1-405b=6260829898,ml/llama-3.1-70b-instruct=6193024246,mist/mistral-nemo=4010954674
2024-09-16|g/gemini-flash-1.5=45809164651,a/claude-3.5-sonnet:beta=18529668225,oi/gpt-4o-mini=12038962974,gr/mythomax-l2-13b=11900652719,ms/wizardlm-2-8x22b=9533467518,a/claude-3.5-sonnet=6597153022,ml/llama-3.1-70b-instruct=6541271330,mist/mistral-nemo=4686796875,nr/hermes-3-llama-3.1-405b=4552484802
2024-09-23|g/gemini-flash-1.5=40542100099,a/claude-3.5-sonnet:beta=29761035218,oi/gpt-4o-mini=23907061563,gr/mythomax-l2-13b=12388711592,ms/wizardlm-2-8x22b=10404836457,a/claude-3.5-sonnet=7070177322,ml/llama-3.1-70b-instruct=6819727111,mist/mistral-nemo=5029303589,ml/llama-3.1-8b-instruct=3702423701
2024-09-30|g/gemini-flash-1.5=34016161362,a/claude-3.5-sonnet:beta=25556075292,oi/gpt-4o-mini=20796511560,gr/mythomax-l2-13b=12173670337,ms/wizardlm-2-8x22b=10545466793,mist/mistral-nemo=9421482211,ml/llama-3.1-70b-instruct=6613820798,a/claude-3.5-sonnet=5667118456,ml/llama-3.1-8b-instruct=3369459109
2024-10-07|g/gemini-flash-1.5=32209715467,oi/gpt-4o-mini=31118327879,a/claude-3.5-sonnet:beta=28747676144,gr/mythomax-l2-13b=12659881630,ms/wizardlm-2-8x22b=9172395554,a/claude-3.5-sonnet=7388035413,ml/llama-3.1-70b-instruct=7351352541,mist/mistral-nemo=6420593760,ml/llama-3.1-8b-instruct=4566650590
2024-10-14|a/claude-3.5-sonnet:beta=28827483904,oi/gpt-4o-mini=16154398638,g/gemini-flash-1.5=13869837814,gr/mythomax-l2-13b=11670132687,a/claude-3.5-sonnet=8118333690,ms/wizardlm-2-8x22b=7486467967,ml/llama-3.1-70b-instruct=6740153906,mist/mistral-nemo=5551118824,liquid/lfm-40b=3950232515
2024-10-21|a/claude-3.5-sonnet:beta=34238705004,oi/gpt-4o-mini=20780860253,gr/mythomax-l2-13b=11957996450,a/claude-3.5-sonnet=11745066097,g/gemini-flash-1.5=8949112812,ml/llama-3.1-70b-instruct=6638774928,g/gemini-flash-1.5-8b=6189764258,ml/llama-3.1-8b-instruct=5557332751,mist/mistral-nemo=4976215812
2024-10-28|a/claude-3.5-sonnet:beta=48858412795,a/claude-3.5-sonnet=18861570371,g/gemini-flash-1.5=17659710153,oi/gpt-4o-mini=17017232940,gr/mythomax-l2-13b=10690441538,ml/llama-3.1-70b-instruct=8682399042,ml/llama-3.1-8b-instruct=7593968087,mist/mistral-nemo=7323737109,g/gemini-flash-1.5-8b=7031809493
2024-11-04|a/claude-3.5-sonnet=48379688529,a/claude-3.5-sonnet:beta=35858049202,g/gemini-flash-1.5-8b=24614256956,g/gemini-flash-1.5=18893163312,oi/gpt-4o-mini=16334666285,gr/mythomax-l2-13b=10934666056,mist/mistral-nemo=9728761587,ml/llama-3.1-70b-instruct=8503957574,ml/llama-3.1-8b-instruct=7670252890
2024-11-11|a/claude-3.5-sonnet:beta=70395306555,a/claude-3.5-sonnet=41551048726,g/gemini-flash-1.5-8b=34939111569,g/gemini-flash-1.5=28985499139,oi/gpt-4o-mini=20918642293,gr/mythomax-l2-13b=10436519760,mist/mistral-nemo=9049946563,ml/llama-3.1-8b-instruct=7858220927,ml/llama-3.1-70b-instruct=7309664812
2024-11-18|a/claude-3.5-sonnet:beta=71225556828,g/gemini-flash-1.5=58198966075,a/claude-3.5-sonnet=43437444852,g/gemini-flash-1.5-8b=31337775444,oi/gpt-4o-mini=21267025239,gr/mythomax-l2-13b=10493824410,mist/mistral-nemo=9666929771,ml/llama-3.1-8b-instruct=9357765565,oi/gpt-4o-mini-2024-07-18=6478138079
2024-11-25|a/claude-3.5-sonnet:beta=64892784108,g/gemini-flash-1.5-8b=42357339360,g/gemini-flash-1.5=41231466082,a/claude-3.5-sonnet=40608194757,cohere/command-r=16297460823,oi/gpt-4o-mini=14660172756,ml/llama-3.1-70b-instruct=10374258153,ml/llama-3.1-8b-instruct=10177492049,gr/mythomax-l2-13b=10018985451
2024-12-02|a/claude-3.5-sonnet:beta=71051191423,a/claude-3.5-sonnet=43588576193,g/gemini-flash-1.5-8b=37339254688,oi/gpt-4o-mini=21197524509,g/gemini-flash-1.5=18423359618,cohere/command-r=10002718475,mist/mistral-nemo=9864789838,gr/mythomax-l2-13b=9546251729,ml/llama-3.1-8b-instruct=8379355885
2024-12-09|g/gemini-flash-1.5=82354407500,a/claude-3.5-sonnet:beta=65669462473,a/claude-3.5-sonnet=44616357426,g/gemini-flash-1.5-8b=39922264725,oi/gpt-4o-mini=15940260211,mist/mistral-nemo=11625010925,gr/mythomax-l2-13b=9933473021,ml/llama-3.1-8b-instruct=5861611254,ml/llama-3.3-70b-instruct=5796341459
2024-12-16|a/claude-3.5-sonnet:beta=101370601592,a/claude-3.5-sonnet=64894885719,g/gemini-flash-1.5=26437534472,g/gemini-flash-1.5-8b=24061855417,oi/gpt-4o-mini=18690407251,mist/mistral-nemo=12234527431,gr/mythomax-l2-13b=8418757431,ml/llama-3.3-70b-instruct=6253494039,ml/llama-3.1-70b-instruct=5330155252
2024-12-23|a/claude-3.5-sonnet:beta=101060618313,a/claude-3.5-sonnet=64143373880,g/gemini-flash-1.5-8b=21187620977,mist/mistral-nemo=15654852392,g/gemini-flash-1.5=14243309524,ds/deepseek-chat-v3=11344594680,oi/gpt-4o-mini=10595936764,gr/mythomax-l2-13b=9323243923,ml/llama-3.1-70b-instruct=5450693226
2024-12-30|a/claude-3.5-sonnet:beta=109612280092,a/claude-3.5-sonnet=64906766076,g/gemini-flash-1.5=28295595196,g/gemini-flash-1.5-8b=26735153325,ds/deepseek-chat-v3=22052193753,ml/llama-3.2-1b-instruct=14979357039,mist/mistral-nemo=13725862541,gr/mythomax-l2-13b=10617021955,oi/gpt-4o-mini=9119864632
2025-01-06|a/claude-3.5-sonnet:beta=150556263251,a/claude-3.5-sonnet=76654506815,g/gemini-flash-1.5=42283674325,g/gemini-flash-1.5-8b=39781784392,ds/deepseek-chat-v3=20386947604,ml/llama-3.2-1b-instruct=18778656406,mist/mistral-nemo=13220646474,oi/gpt-4o-mini=12558664486,gr/mythomax-l2-13b=10924452157
2025-01-13|a/claude-3.5-sonnet:beta=145154037392,a/claude-3.5-sonnet=92339456577,g/gemini-flash-1.5=46786522933,g/gemini-flash-1.5-8b=44349686613,ds/deepseek-chat-v3=16170469505,ml/llama-3.2-1b-instruct=15679846014,oi/gpt-4o-mini=13265235398,mist/mistral-nemo=12457285846,gr/mythomax-l2-13b=11507316950
2025-01-20|a/claude-3.5-sonnet:beta=135037617449,a/claude-3.5-sonnet=106223349678,g/gemini-flash-1.5=46556386515,g/gemini-flash-1.5-8b=39846293672,oi/gpt-4o-mini=15717324511,mist/mistral-nemo=13291726112,gr/mythomax-l2-13b=13070153312,ml/llama-3.1-70b-instruct=12687775717,ml/llama-3.3-70b-instruct=12218108585
2025-01-27|a/claude-3.5-sonnet:beta=150019862408,a/claude-3.5-sonnet=148260581157,g/gemini-flash-1.5=24487573322,oi/gpt-4o-mini=19857747651,mist/mistral-nemo=15986630824,g/gemini-flash-1.5-8b=14839781130,ml/llama-3.3-70b-instruct=13941297133,ds/deepseek-chat-v3=11719786477,ml/llama-3.1-70b-instruct=11194898497
2025-02-03|a/claude-3.5-sonnet=195297688209,a/claude-3.5-sonnet:beta=156190380445,g/gemini-flash-1.5-8b=40823217635,g/gemini-2.0-flash-001=38801314677,g/gemini-flash-1.5=31347844024,mist/mistral-nemo=24922499748,oi/gpt-4o-mini=22474905850,ml/llama-3.3-70b-instruct=16218116997,ds/deepseek-chat-v3=14024077123
2025-02-10|a/claude-3.5-sonnet=225036064456,g/gemini-2.0-flash-001=118368576097,a/claude-3.5-sonnet:beta=106925449435,mist/mistral-nemo=34331188697,g/gemini-flash-1.5=30834252857,g/gemini-flash-1.5-8b=28242231877,oi/gpt-4o-mini=24780244754,ds/deepseek-r1:free=22031827896,ml/llama-3.3-70b-instruct=15993773461
2025-02-17|g/gemini-2.0-flash-001=267073731767,a/claude-3.5-sonnet=176639643672,a/claude-3.5-sonnet:beta=109974198888,g/gemini-flash-1.5=31537093073,ds/deepseek-r1:free=31416730936,g/gemini-flash-1.5-8b=29528555877,oi/gpt-4o-mini=28262009646,ds/deepseek-chat-v3=18634928511,g/gemini-2.0-pro-exp-02-05:free=16909139949
2025-02-24|g/gemini-2.0-flash-001=283589771561,a/claude-3-7-sonnet-20250219=195694456616,a/claude-3.5-sonnet=87955750056,ds/deepseek-r1:free=49307151342,a/claude-3.5-sonnet:beta=41712266645,a/claude-3-7-sonnet-20250219:beta=36251051165,g/gemini-flash-1.5=34744209595,g/gemini-flash-1.5-8b=30573676722,a/claude-3-7-sonnet-20250219:thinking=27432783183
2025-03-03|g/gemini-2.0-flash-001=287866934161,a/claude-3-7-sonnet-20250219=246058893137,a/claude-3.5-sonnet=62452225999,ds/deepseek-r1:free=57113449017,a/claude-3-7-sonnet-20250219:thinking=54566043159,g/gemini-flash-1.5=50787759144,g/gemini-flash-1.5-8b=38903926952,g/gemini-2.0-pro-exp-02-05:free=38669881730,a/claude-3-7-sonnet-20250219:beta=37290150475
2025-03-10|a/claude-3-7-sonnet-20250219=332961486752,g/gemini-2.0-flash-001=287227699898,ds/deepseek-r1:free=75253472287,a/claude-3-7-sonnet-20250219:thinking=68728799686,a/claude-3.5-sonnet=59343236756,ml/llama-3.3-70b-instruct=50007355904,oi/gpt-4o-mini=47327853977,g/gemini-flash-1.5=40949809148,a/claude-3-7-sonnet-20250219:beta=40514065203
2025-03-17|a/claude-3-7-sonnet-20250219=327259743351,g/gemini-2.0-flash-001=245440657034,ml/llama-3.3-70b-instruct=80376957781,ds/deepseek-r1:free=79977265661,a/claude-3-7-sonnet-20250219:thinking=77702078441,a/claude-3.5-sonnet=65228431103,a/claude-3-5-haiku=46079225280,a/claude-3-7-sonnet-20250219:beta=45806856648,oi/gpt-4o-mini=45300601408
2025-03-24|a/claude-3-7-sonnet-20250219=329615206416,g/gemini-2.0-flash-001=249764641763,ml/llama-3.3-70b-instruct=107541899585,g/gemini-2.5-pro-exp-03-25:free=103137112401,ds/deepseek-chat-v3-0324:free=85085498538,a/claude-3-7-sonnet-20250219:thinking=80864716030,ds/deepseek-r1:free=72699644129,oi/gpt-4o-mini=64640865726,a/claude-3.5-sonnet=42989907756
2025-03-31|a/claude-3-7-sonnet-20250219=322076649787,g/gemini-2.0-flash-001=283324287685,oi/gpt-4o-mini=248194581783,g/gemini-2.5-pro-exp-03-25:free=167985166643,ds/deepseek-chat-v3-0324:free=124320763180,ml/llama-3.3-70b-instruct=107947321942,or/quasar-alpha=88666793950,a/claude-3-7-sonnet-20250219:thinking=74988392051,ds/deepseek-r1:free=65851803432
2025-04-07|a/claude-3-7-sonnet-20250219=365264797298,g/gemini-2.0-flash-001=259073137635,oi/gpt-4o-mini=214618119081,or/quasar-alpha=208600546744,g/gemini-2.5-pro-exp-03-25:free=143561298680,or/optimus-alpha=118839696581,ds/deepseek-chat-v3-0324:free=99458630012,g/gemini-2.5-pro-preview-03-25=63642574895,a/claude-3-7-sonnet-20250219:thinking=58801031354
2025-04-14|a/claude-3-7-sonnet-20250219=389609142884,g/gemini-2.0-flash-001=213720042803,g/gemini-2.5-pro-exp-03-25:free=151446234070,ds/deepseek-chat-v3-0324:free=91745322802,g/gemini-2.5-pro-preview-03-25=80421990101,a/claude-3-7-sonnet-20250219:thinking=53940267099,ds/deepseek-chat-v3-0324=53550071796,oi/gpt-4.1-2025-04-14=45656301606,g/gemini-flash-1.5-8b=45594994639
2025-04-21|a/claude-3-7-sonnet-20250219=336565855349,g/gemini-2.0-flash-001=192611517093,g/gemini-2.5-flash-preview-04-17=103127741095,g/gemini-2.5-pro-exp-03-25:free=102559693179,ds/deepseek-chat-v3-0324:free=97586340376,g/gemini-2.5-pro-preview-03-25=95282162527,ds/deepseek-chat-v3-0324=53099849427,a/claude-3-7-sonnet-20250219:thinking=48709481647,ds/deepseek-r1:free=44524500516
2025-04-28|a/claude-3-7-sonnet-20250219=308641256836,g/gemini-2.0-flash-001=210404799203,g/gemini-2.5-pro-exp-03-25=111016869367,oi/gpt-4o-mini=106077999985,g/gemini-2.5-flash-preview-04-17=104463354971,ds/deepseek-chat-v3-0324:free=98660597583,g/gemini-2.5-pro-preview-03-25=76660333802,ds/deepseek-chat-v3-0324=59395243084,a/claude-3-7-sonnet-20250219:thinking=52834218795
2025-05-05|oi/gpt-4o-mini=320235193199,a/claude-3-7-sonnet-20250219=299824035298,g/gemini-2.0-flash-001=226954573997,g/gemini-2.5-flash-preview-04-17=152402480050,g/gemini-2.5-pro-exp-03-25=119188276977,g/gemini-2.5-pro-preview-03-25=93255005338,ds/deepseek-chat-v3-0324:free=89380245163,ds/deepseek-chat-v3-0324=76876523682,ml/llama-3.3-70b-instruct=52093508982
2025-05-12|oi/gpt-4o-mini=439281621110,a/claude-3-7-sonnet-20250219=322351113131,g/gemini-2.0-flash-001=210036401574,g/gemini-2.5-flash-preview-04-17=166683961890,g/gemini-2.5-pro-preview-03-25=141012879612,ds/deepseek-chat-v3-0324:free=87498528014,ds/deepseek-chat-v3-0324=76184930997,g/gemini-2.5-flash-preview-04-17:thinking=50567000725,a/claude-3-7-sonnet-20250219:thinking=44501888287
2025-05-19|oi/gpt-4o-mini=481739760926,a/claude-3-7-sonnet-20250219=321218503782,g/gemini-2.0-flash-001=211364838137,g/gemini-2.5-pro-preview-03-25=178178447400,g/gemini-2.5-flash-preview-04-17=140218221597,a/claude-4-sonnet-20250522=109591232585,ds/deepseek-chat-v3-0324:free=101127899448,ds/deepseek-chat-v3-0324=75947305941,g/gemini-2.5-flash-preview-05-20=53617078442
2025-05-26|oi/gpt-4o-mini=473282220899,a/claude-4-sonnet-20250522=271259772069,g/gemini-2.0-flash-001=220413900461,g/gemini-2.5-pro-preview-03-25=213782811271,a/claude-3-7-sonnet-20250219=196235526119,g/gemini-2.5-flash-preview-04-17=109268327455,g/gemini-2.5-flash-preview-05-20=106614685726,ds/deepseek-chat-v3-0324:free=106587779472,ds/deepseek-chat-v3-0324=85613502232
2025-06-02|oi/gpt-4o-mini=306396506052,a/claude-4-sonnet-20250522=244449908109,g/gemini-2.0-flash-001=231784095679,a/claude-3-7-sonnet-20250219=176014931558,g/gemini-2.5-flash-preview-05-20=167996602945,g/gemini-2.5-pro-preview-03-25=161500515645,ds/deepseek-chat-v3-0324:free=110241309381,ds/deepseek-chat-v3-0324=102460764961,g/gemini-2.5-flash-preview-04-17=88430050007
2025-06-09|a/claude-4-sonnet-20250522=269675098192,g/gemini-2.0-flash-001=266351237996,g/gemini-2.5-flash-preview-05-20=170123360275,a/claude-3-7-sonnet-20250219=133925932020,ds/deepseek-chat-v3-0324:free=122022602975,g/gemini-2.5-pro-preview-06-05=100711290548,ds/deepseek-chat-v3-0324=98089043244,g/gemini-2.5-pro-preview-03-25=84599327293,oi/gpt-4o-mini=61483183777
2025-06-16|a/claude-4-sonnet-20250522=361675145305,g/gemini-2.0-flash-001=254171349764,g/gemini-2.0-flash-lite-001=165089974539,g/gemini-2.5-flash-preview-05-20=162212975763,a/claude-3-7-sonnet-20250219=132678652356,ds/deepseek-chat-v3-0324:free=128822100888,ds/deepseek-chat-v3-0324=114952580228,g/gemini-2.5-pro-preview-06-05=67158362528,g/gemini-2.5-pro-preview-03-25=65560778871
2025-06-23|a/claude-4-sonnet-20250522=333743521074,g/gemini-2.0-flash-001=263063140049,g/gemini-2.5-flash-preview-05-20=231639519571,ds/deepseek-chat-v3-0324:free=129068860811,ds/deepseek-chat-v3-0324=121268370718,g/gemini-2.5-flash-lite-preview-06-17=105525619036,g/gemini-2.5-flash=104393724896,a/claude-3-7-sonnet-20250219=103985897540,g/gemini-2.5-pro=95590173383
2025-06-30|a/claude-4-sonnet-20250522=342978920457,g/gemini-2.0-flash-001=250724110111,g/gemini-2.5-flash-preview-05-20=181572408122,g/gemini-2.5-pro=158667146989,ds/deepseek-chat-v3-0324:free=141719617239,ds/deepseek-chat-v3-0324=138634036066,g/gemini-2.5-flash=125091469489,a/claude-3-7-sonnet-20250219=77956296773,oi/gpt-4o-mini=55329210206
2025-07-07|a/claude-4-sonnet-20250522=351340844557,g/gemini-2.0-flash-001=246852045145,g/gemini-2.5-flash-preview-05-20=232440459461,ds/deepseek-chat-v3-0324:free=188169071399,g/gemini-2.5-flash=182359547129,g/gemini-2.5-pro=156635964211,ds/deepseek-chat-v3-0324=146572211508,a/claude-3-7-sonnet-20250219=61090440519,ds/deepseek-r1-0528:free=49875662401
2025-07-14|a/claude-4-sonnet-20250522=449836825176,g/gemini-2.0-flash-001=255458808538,ds/deepseek-chat-v3-0324:free=236076480059,g/gemini-2.5-flash=234953707589,g/gemini-2.5-pro=179043557580,ds/deepseek-chat-v3-0324=161072771109,g/gemini-2.5-flash-lite-preview-06-17=79188528726,a/claude-3-7-sonnet-20250219=72094135902,ds/deepseek-r1-0528:free=63980679246
2025-07-21|a/claude-4-sonnet-20250522=571707073746,g/gemini-2.5-flash=316006039645,g/gemini-2.0-flash-001=260253573993,ds/deepseek-chat-v3-0324:free=207663664660,g/gemini-2.5-pro=178638718801,ds/deepseek-chat-v3-0324=169896002176,a/claude-3-7-sonnet-20250219=101182190069,ds/deepseek-r1-0528:free=74822571966,qw/qwen3-coder-480b-a35b-07-25:free=68051314582
2025-07-28|a/claude-4-sonnet-20250522=602247714253,g/gemini-2.5-flash=299033229490,g/gemini-2.0-flash-001=272916554932,ds/deepseek-chat-v3-0324:free=210899764808,g/gemini-2.5-pro=163230780914,qw/qwen3-coder-480b-a35b-07-25:free=155740798002,ds/deepseek-chat-v3-0324=152497060588,a/claude-3-7-sonnet-20250219=124922095811,qw/qwen3-coder-480b-a35b-07-25=114756883123
2025-08-04|a/claude-4-sonnet-20250522=520128485411,g/gemini-2.0-flash-001=273959156320,g/gemini-2.5-flash=260590620850,or/horizon-beta=189540499184,ds/deepseek-chat-v3-0324:free=177163922589,ds/deepseek-chat-v3-0324=177135063877,g/gemini-2.5-pro=149759348433,a/claude-3-7-sonnet-20250219=126161097202,qw/qwen3-coder-480b-a35b-07-25=124865838357
2025-08-11|a/claude-4-sonnet-20250522=508569966870,g/gemini-2.5-flash=270390016618,g/gemini-2.0-flash-001=263957704191,ds/deepseek-chat-v3-0324=161719588671,a/claude-3-7-sonnet-20250219=153367755853,qw/qwen3-coder-480b-a35b-07-25=148937520863,ds/deepseek-chat-v3-0324:free=148433235835,g/gemini-2.5-pro=136689416407,ds/deepseek-r1-0528:free=108084760501
2025-08-18|a/claude-4-sonnet-20250522=518030593837,g/gemini-2.5-flash=253189171485,g/gemini-2.0-flash-001=220494437172,ds/deepseek-chat-v3-0324=163206246683,g/gemini-2.5-pro=143513036230,qw/qwen3-coder-480b-a35b-07-25=140479683096,a/claude-3-7-sonnet-20250219=127966656277,ds/deepseek-r1-0528:free=110608018759,ds/deepseek-chat-v3-0324:free=99465996092
2025-08-25|a/claude-4-sonnet-20250522=553086505715,xai/grok-code-fast-1=384345463725,g/gemini-2.5-flash=338837679987,g/gemini-2.0-flash-001=200313018302,g/gemini-2.5-pro=181237282885,ds/deepseek-chat-v3-0324=152162945071,ds/deepseek-chat-v3.1=148553978940,qw/qwen3-coder-480b-a35b-07-25=105735124347"""

result = []
for line in raw.strip().split('\n'):
    date, models_str = line.split('|')
    models = []
    for m in models_str.split(','):
        model_abbr, tokens = m.rsplit('=', 1)
        models.append({"model": expand(model_abbr), "tokens": int(tokens)})
    result.append({"date": date, "models": models})

out = '/sessions/affectionate-intelligent-ride/mnt/outputs/token-usage-open-router/data/rankings-history.json'
with open(out, 'w') as f:
    json.dump(result, f, indent=2)

print(f"Written {len(result)} weeks")
print(f"Range: {result[0]['date']} to {result[-1]['date']}")
